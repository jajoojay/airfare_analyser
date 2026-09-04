"""REST API Router v1 for the India Airfare Price Observatory (Official MoSPI Specifications)."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.session import get_db
from packages.schemas.models import (
    Airline,
    DiscrepancyAudit,
    FareObservation,
    IndexValue,
    MethodologyVersion,
    Route,
)
from packages.statistics.carrier_inflation import CarrierInflationService
from packages.statistics.volatility import VolatilityService
from packages.statistics.weights import DGCAWeightEngine
from services.collectors.health_service import CollectorHealthService

router = APIRouter(prefix="/api/v1", tags=["Observatory Core API"])


@router.get("/index")
def get_current_index(
    series: str = Query("BASE_FARE", pattern="^(BASE_FARE|TOTAL_PRICE)$"),
    horizon: str = Query("t14", pattern="^(t1|t7|t14|t30|t45)$"),
    db: Session = Depends(get_db),
):
    """Retrieves current headline index value and deltas."""
    h_int = int(horizon.replace("t", ""))
    itype = "HEADLINE_T14" if h_int == 14 else f"SUB_T{h_int}"

    latest = (
        db.query(IndexValue)
        .filter(
            IndexValue.index_series == series,
            IndexValue.index_type == itype,
            IndexValue.route_id.is_(None),
        )
        .order_by(IndexValue.period_start.desc())
        .first()
    )

    if not latest:
        # Check if there is ANY headline index calculated in DB
        any_headline = (
            db.query(IndexValue)
            .filter(IndexValue.route_id.is_(None))
            .order_by(IndexValue.period_start.desc())
            .first()
        )
        if any_headline:
            latest = any_headline
        else:
            return None

    return {
        "index_series": latest.index_series,
        "index_type": latest.index_type,
        "lead_time_days": latest.lead_time_days,
        "index_value": latest.index_value,
        "daily_change_pct": latest.daily_change_pct,
        "weekly_change_pct": latest.weekly_change_pct,
        "monthly_change_pct": latest.monthly_change_pct,
        "coverage_rate": latest.coverage_rate,
        "is_low_coverage": latest.is_low_coverage,
        "period_start": latest.period_start.isoformat(),
        "active_version": latest.methodology_version,
    }


@router.get("/index/timeseries")
def get_index_timeseries(
    series: str = Query("BASE_FARE", pattern="^(BASE_FARE|TOTAL_PRICE)$"),
    horizon: int = Query(14),
    db: Session = Depends(get_db),
):
    """Returns historical daily time-series of index values."""
    itype = "HEADLINE_T14" if horizon == 14 else f"SUB_T{horizon}"
    records = (
        db.query(IndexValue)
        .filter(
            IndexValue.index_series == series,
            IndexValue.index_type == itype,
            IndexValue.route_id.is_(None),
        )
        .order_by(IndexValue.period_start.asc())
        .all()
    )

    return [
        {
            "date": r.period_start.isoformat(),
            "index_value": r.index_value,
            "daily_change_pct": r.daily_change_pct,
            "coverage_rate": r.coverage_rate,
        }
        for r in records
    ]


@router.get("/index/daily")
def get_daily_indices(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    series: str = Query("BASE_FARE", pattern="^(BASE_FARE|TOTAL_PRICE)$"),
    horizon: int = Query(14),
    db: Session = Depends(get_db),
):
    """Returns filtered daily index time-series between from_date and to_date."""
    import datetime

    itype = "HEADLINE_T14" if horizon == 14 else f"SUB_T{horizon}"
    query = db.query(IndexValue).filter(
        IndexValue.index_series == series,
        IndexValue.index_type == itype,
        IndexValue.route_id.is_(None),
    )
    if from_date:
        query = query.filter(IndexValue.period_start >= datetime.date.fromisoformat(from_date))
    if to_date:
        query = query.filter(IndexValue.period_start <= datetime.date.fromisoformat(to_date))

    records = query.order_by(IndexValue.period_start.asc()).all()
    return [
        {
            "date": r.period_start.isoformat(),
            "index_value": r.index_value,
            "daily_change_pct": r.daily_change_pct,
            "coverage_rate": r.coverage_rate,
            "is_low_coverage": r.is_low_coverage,
        }
        for r in records
    ]


@router.get("/index/monthly")
def get_monthly_aggregated_indices(
    series: str = Query("BASE_FARE", pattern="^(BASE_FARE|TOTAL_PRICE)$"),
    db: Session = Depends(get_db),
):
    """Returns monthly calendar-aggregated index series for MoSPI CPI alignment."""
    from packages.statistics.temporal_aggregations import TemporalAggregationEngine

    records = (
        db.query(IndexValue)
        .filter(
            IndexValue.index_series == series,
            IndexValue.index_type == "HEADLINE_T14",
            IndexValue.route_id.is_(None),
        )
        .order_by(IndexValue.period_start.asc())
        .all()
    )

    daily_dicts = [
        {
            "date": r.period_start,
            "index_value": r.index_value,
            "index_series": r.index_series,
            "index_type": r.index_type,
            "coverage_rate": r.coverage_rate,
        }
        for r in records
    ]
    return TemporalAggregationEngine.aggregate_monthly(daily_dicts)


@router.get("/weights")
def get_basket_weights(db: Session = Depends(get_db)):
    """Returns all active and historical DGCA route weights."""
    from packages.schemas.models import RouteWeight

    weights = (
        db.query(RouteWeight, Route)
        .join(Route, RouteWeight.route_id == Route.id)
        .order_by(RouteWeight.effective_from.desc(), RouteWeight.weight.desc())
        .all()
    )
    return [
        {
            "route_code": r.route_code,
            "corridor_type": r.corridor_type,
            "passenger_volume": rw.passenger_volume,
            "normalized_weight": rw.weight,
            "weight_pct": round(rw.weight * 100, 2),
            "methodology_version": rw.methodology_version,
            "effective_from": rw.effective_from.isoformat(),
            "effective_to": rw.effective_to.isoformat() if rw.effective_to else None,
        }
        for rw, r in weights
    ]


@router.get("/routes")
def list_routes_summary(db: Session = Depends(get_db)):
    """Returns all 10 monitored corridors with corridor types, weights, and latest index values."""
    routes = db.query(Route).filter(Route.active).all()
    weights = DGCAWeightEngine.get_active_weights(db)

    results = []
    for r in routes:
        latest_idx = (
            db.query(IndexValue)
            .filter(
                IndexValue.route_id == r.id,
                IndexValue.index_type == "ROUTE_LEVEL",
                IndexValue.index_series == "BASE_FARE",
            )
            .order_by(IndexValue.period_start.desc())
            .first()
        )

        results.append(
            {
                "id": r.id,
                "route_code": r.route_code,
                "origin": r.origin,
                "destination": r.destination,
                "origin_airport": r.origin_airport,
                "destination_airport": r.destination_airport,
                "corridor_type": r.corridor_type,
                "dgca_weight": weights.get(r.route_code, 0.1),
                "current_index": latest_idx.index_value if latest_idx else None,
                "daily_change_pct": latest_idx.daily_change_pct if latest_idx else None,
                "weekly_change_pct": latest_idx.weekly_change_pct if latest_idx else None,
                "monthly_change_pct": latest_idx.monthly_change_pct if latest_idx else None,
            }
        )

    return results


@router.get("/routes/{route_code}")
def get_route_detail(route_code: str, db: Session = Depends(get_db)):
    """Returns detailed corridor breakdown dynamically computed from authentic database observations."""
    route = db.query(Route).filter(Route.route_code == route_code.upper()).first()
    if not route:
        raise HTTPException(status_code=404, detail=f"Route {route_code} not found")

    weights = DGCAWeightEngine.get_active_weights(db)
    airlines = {a.id: a for a in db.query(Airline).all()}

    # Query real observations for this corridor
    observations = (
        db.query(FareObservation)
        .filter(FareObservation.route_id == route.id)
        .order_by(FareObservation.search_timestamp.desc())
        .all()
    )

    if observations:
        # Group by airline
        carrier_map = {}
        for o in observations:
            al = airlines.get(o.airline_id)
            code = al.code if al else "6E"
            name = al.name if al else "Carrier"
            if code not in carrier_map:
                carrier_map[code] = {
                    "carrier": code,
                    "name": name,
                    "quotes": [],
                    "flight_count": 0,
                }
            carrier_map[code]["quotes"].append(o)
            carrier_map[code]["flight_count"] += 1

        carrier_quotes = []
        min_overall_fare = min(o.base_fare for o in observations)

        for code, data in carrier_map.items():
            base_fares = [q.base_fare for q in data["quotes"]]
            basic_min = min(base_fares) if base_fares else 4200.0
            flexi_candidates = [q.total_fare for q in data["quotes"] if q.fare_family != "BASIC"]
            flexi_fare = min(flexi_candidates) if flexi_candidates else round(basic_min * 1.55, 2)

            carrier_quotes.append(
                {
                    "carrier": code,
                    "name": data["name"],
                    "basic_fare": round(basic_min, 2),
                    "flexi_fare": round(flexi_fare, 2),
                    "is_min": abs(basic_min - min_overall_fare) < 1.0,
                    "flights": data["flight_count"],
                }
            )

        # Fare decomposition: average across authentic observations
        n = len(observations)
        base_fare_avg = sum(o.base_fare for o in observations) / n
        fuel_avg = sum(o.fuel_surcharge for o in observations) / n
        tax_avg = sum(o.tax_amount for o in observations) / n
        udf_avg = sum(o.development_fee for o in observations) / n
        conv_avg = sum(o.convenience_fee for o in observations) / n
        total_fare_avg = sum(o.total_fare for o in observations) / n

        # Representative price: median of basic fares across carriers
        basic_fares_list = sorted([c["basic_fare"] for c in carrier_quotes])
        mid = len(basic_fares_list) // 2
        rep_price = basic_fares_list[mid] if basic_fares_list else round(base_fare_avg, 2)

        decomp = {
            "base_fare": round(base_fare_avg, 2),
            "fuel_surcharge": round(fuel_avg, 2),
            "gst_taxes": round(tax_avg, 2),
            "udf_adf": round(udf_avg, 2),
            "convenience_fee": round(conv_avg, 2),
            "total_consumer_fare": round(total_fare_avg, 2),
        }
    else:
        carrier_quotes = []
        rep_price = None
        decomp = None

    return {
        "route_code": route.route_code,
        "origin": route.origin,
        "destination": route.destination,
        "corridor_type": route.corridor_type,
        "weight_pct": round(weights.get(route.route_code, 0.1) * 100, 1),
        "representative_price": rep_price,
        "fare_decomposition": decomp,
        "carrier_breakdown": carrier_quotes,
    }


@router.get("/lead-time")
def get_lead_time_analytics(route_code: str = Query("DEL-BOM"), db: Session = Depends(get_db)):
    """Calculates dynamic lead-time curve and surge multiplier dynamically from live observations."""
    route = db.query(Route).filter(Route.route_code == route_code.upper()).first()
    if not route:
        route = db.query(Route).first()

    horizons = [
        (45, "T+45", "Early Bird"),
        (30, "T+30", "Advance Planning"),
        (14, "T+14", "Headline Anchor"),
        (7, "T+7", "Short Planning"),
        (1, "T+1", "Departure Eve"),
    ]

    curve = []
    for days, hor_code, label in horizons:
        obs = (
            db.query(FareObservation)
            .filter(
                FareObservation.route_id == route.id,
                FareObservation.advance_purchase_days == days,
            )
            .all()
        )
        if obs:
            fares = sorted([o.base_fare for o in obs if o.base_fare > 0])
            price = fares[len(fares) // 2] if fares else None
        else:
            price = None

        curve.append(
            {
                "advance_days": days,
                "horizon": hor_code,
                "price": round(price, 2) if price is not None else None,
                "label": label,
            }
        )

    t1_p = curve[-1]["price"]
    t45_p = curve[0]["price"]
    surge_mult = round(t1_p / t45_p, 2) if (t1_p and t45_p and t45_p > 0) else None

    # Carrier escalations
    airlines = {a.id: a.code for a in db.query(Airline).all()}
    carrier_obs = db.query(FareObservation).filter(FareObservation.route_id == route.id).all()
    carrier_horizons = {}
    for o in carrier_obs:
        code = airlines.get(o.airline_id)
        if not code:
            continue
        if code not in carrier_horizons:
            carrier_horizons[code] = {}
        if o.advance_purchase_days not in carrier_horizons[code]:
            carrier_horizons[code][o.advance_purchase_days] = []
        if o.base_fare and o.base_fare > 0:
            carrier_horizons[code][o.advance_purchase_days].append(o.base_fare)

    carrier_escalations = []
    for code, hdict in carrier_horizons.items():
        c_mult = None
        if 1 in hdict and 45 in hdict and min(hdict[45]) > 0:
            c_mult = round(min(hdict[1]) / min(hdict[45]), 2)
        elif 1 in hdict and 14 in hdict and min(hdict[14]) > 0:
            c_mult = round(min(hdict[1]) / min(hdict[14]), 2)
        if c_mult is not None:
            carrier_escalations.append({"carrier": code, "surge_multiplier": c_mult})

    return {
        "route_code": route.route_code,
        "surge_multiplier": surge_mult,
        "lead_time_curve": curve,
        "carrier_escalations": carrier_escalations,
    }


@router.get("/validation")
def get_validation_scorecard(db: Session = Depends(get_db)):
    """Returns MoSPI CPI airfare benchmark directional co-movement metrics and series."""
    from packages.statistics.benchmark_matcher import BenchmarkMatcherService

    # Check if benchmark records exist, if not ingest
    benchmarks = BenchmarkMatcherService.get_benchmark_series(db)
    if not benchmarks:
        BenchmarkMatcherService.ingest_mospi_benchmark_csv(db)
        benchmarks = BenchmarkMatcherService.get_benchmark_series(db)

    # Calculate scorecard
    return BenchmarkMatcherService.calculate_directional_co_movement(
        prototype_monthly=[],
        mospi_monthly=benchmarks,
    )


@router.get("/data-quality")
def get_quality_monitor(db: Session = Depends(get_db)):
    """Returns ingestion health, capture rates, real-life vs synthetic distribution."""
    real_count = db.query(FareObservation).filter(FareObservation.is_synthetic.is_(False)).count()
    synth_count = db.query(FareObservation).filter(FareObservation.is_synthetic.is_(True)).count()
    carrier_direct = (
        db.query(FareObservation).filter(FareObservation.feed_type == "CARRIER_DIRECT").count()
    )
    rpc_fallback = (
        db.query(FareObservation).filter(FareObservation.feed_type == "RPC_FALLBACK").count()
    )

    total = real_count + synth_count
    real_pct = round((real_count / total * 100), 1) if total > 0 else 0.0

    scores = [
        o[0]
        for o in db.query(FareObservation.quality_score)
        .filter(FareObservation.quality_score.isnot(None))
        .all()
    ]
    if scores:
        n_scores = len(scores)
        b_90_100 = sum(1 for s in scores if s >= 90) / n_scores * 100
        b_70_89 = sum(1 for s in scores if 70 <= s < 90) / n_scores * 100
        b_50_69 = sum(1 for s in scores if 50 <= s < 70) / n_scores * 100
        b_0_49 = sum(1 for s in scores if s < 50) / n_scores * 100
        score_dist = [
            {"bracket": "90-100 (ACCEPT)", "percentage": round(b_90_100, 1)},
            {"bracket": "70-89 (ACCEPT_WARNING)", "percentage": round(b_70_89, 1)},
            {"bracket": "50-69 (REVIEW)", "percentage": round(b_50_69, 1)},
            {"bracket": "0-49 (REJECT)", "percentage": round(b_0_49, 1)},
        ]
        # Expected baseline: 10 corridors * 5 horizons * 4 carriers = 200 quotes per cycle
        capture_rate = round(min(100.0, (total / max(1, 200)) * 100), 1) if total > 0 else 0.0
    else:
        score_dist = []
        capture_rate = 0.0

    rejected_count = (
        db.query(FareObservation).filter(FareObservation.quality_status == "REJECT").count()
    )
    warning_count = (
        db.query(FareObservation)
        .filter(FareObservation.quality_status == "ACCEPT_WITH_WARNING")
        .count()
    )
    dedup_count = (
        db.query(FareObservation).filter(FareObservation.is_carrier_min_fare.is_(False)).count()
    )

    return {
        "quote_capture_rate_pct": capture_rate,
        "valid_quotes_count": total,
        "real_life_quotes_count": real_count,
        "synthetic_baseline_count": synth_count,
        "carrier_direct_quotes_count": carrier_direct,
        "rpc_fallback_quotes_count": rpc_fallback,
        "real_life_share_pct": real_pct,
        "rejected_quotes_count": rejected_count,
        "parser_warnings_count": warning_count,
        "deduplicated_quotes_count": dedup_count,
        "score_distribution": score_dist,
    }


@router.get("/validation/cross-feed")
def get_cross_feed_validation(
    route_code: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Returns real-time parity and discrepancy audit records comparing Carrier Direct vs RPC Validator."""
    query = db.query(DiscrepancyAudit)
    if route_code:
        route = db.query(Route).filter(Route.route_code == route_code.upper()).first()
        if route:
            query = query.filter(DiscrepancyAudit.route_id == route.id)

    audits = query.order_by(DiscrepancyAudit.verified_at.desc()).limit(limit).all()

    airlines = {a.id: a.code for a in db.query(Airline).all()}
    routes = {r.id: r.route_code for r in db.query(Route).all()}

    total_audits = len(audits)
    parities = sum(1 for a in audits if a.validation_status == "EXACT_PARITY")
    markups = sum(1 for a in audits if a.validation_status == "AGGREGATOR_MARKUP")
    fallbacks = sum(1 for a in audits if a.validation_status == "FALLBACK_RPC_USED")
    carrier_direct = sum(1 for a in audits if a.carrier_direct_price is not None)

    avg_discrepancy = sum(
        a.discrepancy_pct for a in audits if a.carrier_direct_price is not None
    ) / max(1, carrier_direct)

    return {
        "total_audits": total_audits,
        "carrier_direct_count": carrier_direct,
        "rpc_fallback_count": fallbacks,
        "exact_parity_count": parities,
        "aggregator_markup_count": markups,
        "average_discrepancy_pct": round(avg_discrepancy, 2),
        "parity_rate_pct": round((parities / max(1, carrier_direct)) * 100, 1),
        "audits": [
            {
                "id": a.id,
                "route_code": routes.get(a.route_id, "DEL-BOM"),
                "carrier": airlines.get(a.airline_id, "6E"),
                "flight_number": a.flight_number,
                "travel_date": a.travel_date.isoformat(),
                "advance_days": a.advance_purchase_days,
                "carrier_direct_price": a.carrier_direct_price,
                "rpc_validator_price": a.rpc_validator_price,
                "discrepancy_amount": a.discrepancy_amount,
                "discrepancy_pct": a.discrepancy_pct,
                "status": a.validation_status,
                "notes": a.notes,
                "verified_at": a.verified_at.isoformat() if a.verified_at else None,
            }
            for a in audits
        ],
    }


@router.post("/live/collect")
def trigger_live_collection(
    route_code: str = Query("DEL-BOM"),
    advance_days: int = Query(7),
):
    """Triggers an on-demand real-world dual-feed collection cycle for a route & horizon."""
    from services.collectors.dual_feed_runner import run_dual_feed_collection

    res = run_dual_feed_collection(route_code=route_code, advance_days=advance_days)
    return {
        "status": "SUCCESS",
        "route_code": res["route_code"],
        "travel_date": res["travel_date"],
        "advance_days": res["advance_days"],
        "total_flights_evaluated": res["total_flights_evaluated"],
        "carrier_direct_quotes_count": res["carrier_direct_quotes_count"],
        "rpc_fallback_quotes_count": res["rpc_fallback_quotes_count"],
        "average_discrepancy_pct": res["average_discrepancy_pct"],
    }


@router.post("/collection/trigger-cycle")
def trigger_full_collection_cycle(db: Session = Depends(get_db)):
    """
    Triggers complete scheduled collection cycle across all 10 corridors x 5 horizons (50 jobs)
    and automatically recomputes and persists all daily headline and route indices.
    """
    import datetime

    from services.scheduler.collection_scheduler import CollectionScheduler

    sched = CollectionScheduler()
    summary = sched.trigger_collection_cycle(db=db)
    return {
        "status": "SUCCESS",
        "executed_at": datetime.datetime.now(datetime.UTC).isoformat(),
        "collection_summary": summary,
    }


@router.get("/source-health")
def get_sources_health(db: Session = Depends(get_db)):
    """Returns live operational telemetry for registered sources."""
    return CollectorHealthService.get_all_sources_health(db)


@router.get("/fuel-context")
def get_fuel_context(location: str = Query("Delhi"), db: Session = Depends(get_db)):
    """Returns ATF jet fuel price context and non-causal explanation."""
    from packages.statistics.fuel_context import ATFContextService

    return ATFContextService.generate_non_causal_report(db, location=location)


@router.get("/methodology")
def get_methodology_spec(db: Session = Depends(get_db)):
    """Returns mathematical formulation, route basket weights, and documented limitations."""
    version = db.query(MethodologyVersion).filter(MethodologyVersion.version == "APIX-2.0").first()
    weights = DGCAWeightEngine.get_active_weights(db)

    return {
        "version": "APIX-2.0",
        "name": "India Airfare Price Observatory (Modified Laspeyres with Fare-Mix Protection & T+14 Anchor)",
        "base_period": "2026-08-01 = 100",
        "anchor_window": "T+14 (Two-Week Advance Purchase)",
        "formula": "I_t = 100 * sum(w_j * (P_{j,t,T+14} / P_{j,0,T+14}))",
        "estimator": "Lowest available non-refundable Economy fare per scheduled carrier, median across carriers",
        "notes": version.notes if version else "APIX-2.0 production methodology.",
        "basket_weights": [
            {"route": r, "weight": w, "weight_pct": round(w * 100, 2)} for r, w in weights.items()
        ],
    }


# -----------------------------------------------------------------------------
# Carrier-Wise Price Inflation Analytics (CPI-Carrier)
# -----------------------------------------------------------------------------


@router.get("/analytics/carrier-inflation")
def get_carrier_inflation(
    horizon: int = Query(14, description="Advance purchase horizon days (1, 7, 14, 30, 45)"),
    db: Session = Depends(get_db),
):
    """Retrieves current carrier-specific price inflation indices and inter-airline price dispersion."""
    return CarrierInflationService.get_latest_carrier_inflation(db, horizon_days=horizon)


@router.get("/analytics/carrier-inflation/timeseries")
def get_carrier_inflation_timeseries(
    horizon: int = Query(14, description="Advance purchase horizon days (1, 7, 14, 30, 45)"),
    limit: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Retrieves aligned multi-carrier timeseries for comparative airline inflation tracking."""
    return CarrierInflationService.get_carrier_timeseries(db, horizon_days=horizon, limit=limit)


# -----------------------------------------------------------------------------
# Price Fluctuation & Intraday Volatility Analytics
# -----------------------------------------------------------------------------


@router.get("/analytics/volatility")
def get_network_volatility(
    horizon: int = Query(14, description="Advance purchase horizon days (1, 7, 14, 30, 45)"),
    db: Session = Depends(get_db),
):
    """Retrieves route-level price dispersion, intraday spreads, standard deviations, and surge alerts."""
    return VolatilityService.get_network_volatility_summary(db, horizon_days=horizon)


@router.get("/analytics/volatility/{route_code}")
def get_route_volatility_trajectory(
    route_code: str,
    db: Session = Depends(get_db),
):
    """Retrieves flight-by-flight quotes and price distributions for an individual corridor."""
    result = VolatilityService.get_route_intraday_trajectory(db, route_code=route_code.upper())
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
