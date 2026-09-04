"""Daily Airfare Index Calculation Service (PRD Section 27, 28, 40.8, 41)."""

import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from packages.schemas.models import FareObservation, IndexValue, Route, RouteWeight
from packages.statistics.estimators import RepresentativePriceEstimator
from packages.statistics.index_engine import AirfareIndexEngine
from packages.statistics.weights import DGCAWeightEngine


class DailyIndexCalculatorService:
    """Calculates daily headline index (T+15), unpooled horizon sub-indices, and route-level indices."""

    HORIZONS = [1, 7, 15, 30, 45]
    HEADLINE_HORIZON = 15
    PRICE_SERIES = ["BASE_FARE", "TOTAL_PRICE"]

    @classmethod
    def get_route_representative_prices(
        cls,
        db: Session,
        observation_date: datetime.date,
        advance_days: int,
        price_field: str = "base_fare",
    ) -> Dict[str, float]:
        """Calculates representative prices for all active routes on a given date and horizon."""
        routes = db.query(Route).filter(Route.active).all()
        rep_prices: Dict[str, float] = {}

        for route in routes:
            observations = (
                db.query(FareObservation)
                .filter(
                    FareObservation.route_id == route.id,
                    FareObservation.search_timestamp
                    >= datetime.datetime.combine(observation_date, datetime.time.min),
                    FareObservation.search_timestamp
                    <= datetime.datetime.combine(observation_date, datetime.time.max),
                    FareObservation.advance_purchase_days == advance_days,
                )
                .all()
            )

            if not observations:
                continue

            obs_dicts = [
                {
                    "carrier": str(o.airline_id),  # Carrier proxy
                    "cabin_class": o.cabin_class,
                    "fare_family": o.fare_family,
                    "availability_status": o.availability_status,
                    "base_fare": o.base_fare,
                    "total_fare": o.total_fare,
                }
                for o in observations
            ]

            est = RepresentativePriceEstimator.estimate_route_price(
                observations=obs_dicts,
                price_field=price_field,
                estimator="MEDIAN",
                cabin_class="ECONOMY",
                fare_family="BASIC",
            )

            if est and est.get("representative_price") is not None:
                rep_prices[route.route_code] = est["representative_price"]

        return rep_prices

    @classmethod
    def calculate_day_indices(
        cls,
        db: Session,
        observation_date: datetime.date,
        base_date: Optional[datetime.date] = None,
        methodology_version: str = "APIX-2.0",
        weight_version: str = "DGCA_2026_V1",
    ) -> List[IndexValue]:
        """
        Calculates and persists all daily indices for an observation date:
        - Headline Index (T+15 Anchor) for BASE_FARE and TOTAL_PRICE
        - Unpooled Lead-Time Sub-Indices (T+1, T+7, T+15, T+30, T+45)
        - Route-level indices
        - Computes 1D, 7D, and 30D percentage changes.
        """
        if base_date is None:
            base_date = datetime.date(2026, 8, 1)

        route_weights = DGCAWeightEngine.get_active_weights(db, target_date=observation_date)
        if not route_weights:
            # Fallback to seeded weights if none effective
            all_w = db.query(RouteWeight, Route).join(Route, RouteWeight.route_id == Route.id).all()
            route_weights = {r.route_code: rw.weight for rw, r in all_w}

        # Normalize weights if needed
        total_w = sum(route_weights.values())
        if total_w > 0:
            route_weights = {r: w / total_w for r, w in route_weights.items()}

        routes = db.query(Route).filter(Route.active).all()
        route_id_map = {r.route_code: r.id for r in routes}

        created_index_records: List[IndexValue] = []

        for series_name in cls.PRICE_SERIES:
            field_name = "base_fare" if series_name == "BASE_FARE" else "total_fare"

            for horizon in cls.HORIZONS:
                is_headline = horizon == cls.HEADLINE_HORIZON
                index_type = "HEADLINE_T15" if is_headline else f"SUB_T{horizon}"

                # 1. Representative prices for current date
                current_prices = cls.get_route_representative_prices(
                    db, observation_date, advance_days=horizon, price_field=field_name
                )

                # 2. Base period prices
                base_prices = cls.get_route_representative_prices(
                    db, base_date, advance_days=horizon, price_field=field_name
                )

                # Fallback if base date prices equal to current or missing
                for rcode, cp in current_prices.items():
                    if rcode not in base_prices or base_prices[rcode] <= 0:
                        base_prices[rcode] = cp

                if not current_prices:
                    continue

                # 3. Calculate National Index
                nat_result = AirfareIndexEngine.calculate_national_index(
                    route_prices=current_prices,
                    base_prices=base_prices,
                    route_weights=route_weights,
                )

                # 4. Compute percentage deltas
                deltas = cls._calculate_deltas(
                    db=db,
                    current_value=nat_result["index_value"],
                    series_name=series_name,
                    index_type=index_type,
                    lead_time=horizon,
                    observation_date=observation_date,
                    route_id=None,
                )

                # 5. Persist National Index record
                # Remove existing record if re-calculating
                db.query(IndexValue).filter(
                    IndexValue.index_series == series_name,
                    IndexValue.index_type == index_type,
                    IndexValue.period_start == observation_date,
                    IndexValue.route_id.is_(None),
                ).delete()

                nat_record = IndexValue(
                    index_series=series_name,
                    index_type=index_type,
                    lead_time_days=horizon,
                    period_start=observation_date,
                    period_end=observation_date,
                    route_id=None,
                    index_value=nat_result["index_value"],
                    daily_change_pct=deltas["1d"],
                    weekly_change_pct=deltas["7d"],
                    monthly_change_pct=deltas["30d"],
                    coverage_rate=nat_result["coverage_rate"],
                    is_low_coverage=nat_result["is_low_coverage"],
                    methodology_version=methodology_version,
                    weight_version=weight_version,
                    calculated_at=datetime.datetime.now(datetime.UTC),
                )
                db.add(nat_record)
                created_index_records.append(nat_record)

                # 6. If headline horizon, also persist route-level indices
                if is_headline:
                    for rcode, r_idx in nat_result["route_indices"].items():
                        rid = route_id_map.get(rcode)
                        if not rid:
                            continue

                        r_deltas = cls._calculate_deltas(
                            db=db,
                            current_value=r_idx,
                            series_name=series_name,
                            index_type="ROUTE_LEVEL",
                            lead_time=horizon,
                            observation_date=observation_date,
                            route_id=rid,
                        )

                        db.query(IndexValue).filter(
                            IndexValue.index_series == series_name,
                            IndexValue.index_type == "ROUTE_LEVEL",
                            IndexValue.period_start == observation_date,
                            IndexValue.route_id == rid,
                        ).delete()

                        route_rec = IndexValue(
                            index_series=series_name,
                            index_type="ROUTE_LEVEL",
                            lead_time_days=horizon,
                            period_start=observation_date,
                            period_end=observation_date,
                            route_id=rid,
                            index_value=r_idx,
                            daily_change_pct=r_deltas["1d"],
                            weekly_change_pct=r_deltas["7d"],
                            monthly_change_pct=r_deltas["30d"],
                            coverage_rate=100.0,
                            is_low_coverage=False,
                            methodology_version=methodology_version,
                            weight_version=weight_version,
                            calculated_at=datetime.datetime.now(datetime.UTC),
                        )
                        db.add(route_rec)
                        created_index_records.append(route_rec)

        db.commit()
        return created_index_records

    @classmethod
    def _calculate_deltas(
        cls,
        db: Session,
        current_value: float,
        series_name: str,
        index_type: str,
        lead_time: int,
        observation_date: datetime.date,
        route_id: Optional[int] = None,
    ) -> Dict[str, Optional[float]]:
        """Calculates 1D, 7D, and 30D percentage deltas relative to historical index values."""
        deltas: Dict[str, Optional[float]] = {"1d": None, "7d": None, "30d": None}

        for delta_key, days_back in [("1d", 1), ("7d", 7), ("30d", 30)]:
            prior_date = observation_date - datetime.timedelta(days=days_back)
            query = db.query(IndexValue).filter(
                IndexValue.index_series == series_name,
                IndexValue.index_type == index_type,
                IndexValue.lead_time_days == lead_time,
                IndexValue.period_start == prior_date,
            )
            if route_id is not None:
                query = query.filter(IndexValue.route_id == route_id)
            else:
                query = query.filter(IndexValue.route_id.is_(None))

            prior_rec = query.first()
            if prior_rec and prior_rec.index_value > 0:
                pct_change = (
                    (current_value - prior_rec.index_value) / prior_rec.index_value
                ) * 100.0
                deltas[delta_key] = round(pct_change, 2)

        return deltas

    @classmethod
    def compute_historical_index_range(
        cls,
        db: Session,
        start_date: datetime.date,
        end_date: datetime.date,
    ) -> int:
        """Batch computes daily indices across a date range."""
        current = start_date
        total_computed = 0

        while current <= end_date:
            recs = cls.calculate_day_indices(db, observation_date=current, base_date=start_date)
            total_computed += len(recs)
            current += datetime.timedelta(days=1)

        return total_computed
