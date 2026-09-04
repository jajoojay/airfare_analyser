"""Representative Route Price Estimators with Fare-Mix Protection."""

from typing import Any, Dict, List, Optional

import numpy as np


class RepresentativePriceEstimator:
    """Calculates standardized, robust representative route prices per corridor/date/horizon."""

    @classmethod
    def estimate_route_price(
        cls,
        observations: List[Dict[str, Any]],
        price_field: str = "base_fare",
        estimator: str = "MEDIAN",
        cabin_class: str = "ECONOMY",
        fare_family: str = "BASIC",
    ) -> Optional[Dict[str, Any]]:
        """
        Estimates representative price with fare-mix protection:
        1. Filters to specified cabin and fare family (default: ECONOMY + BASIC).
        2. Filters out SOLD_OUT, CANCELLED, and invalid prices.
        3. For each active carrier, extracts the minimum available quote.
        4. Calculates the estimator (MEDIAN / TRIMMED_MEAN / MEAN) across carriers.
        """
        # Step 1 & 2: Filter valid available observations
        valid_quotes = []
        for obs in observations:
            avail = str(obs.get("availability_status", "AVAILABLE")).upper()
            if avail != "AVAILABLE":
                continue

            obs_cabin = str(obs.get("cabin_class", "ECONOMY")).upper()
            obs_family = str(obs.get("fare_family", "BASIC")).upper()

            if obs_cabin != cabin_class.upper():
                continue
            if fare_family and obs_family != fare_family.upper():
                continue

            price = obs.get(price_field)
            if price is None:
                continue

            try:
                price_val = float(price)
                if price_val > 0:
                    valid_quotes.append(
                        {"carrier": str(obs.get("carrier", "UNKNOWN")), "price": price_val}
                    )
            except (ValueError, TypeError):
                continue

        if not valid_quotes:
            return None

        # Step 3: Extract minimum price per carrier (fare-mix protection)
        carrier_min_fares: Dict[str, float] = {}
        for q in valid_quotes:
            c = q["carrier"]
            p = q["price"]
            if c not in carrier_min_fares or p < carrier_min_fares[c]:
                carrier_min_fares[c] = p

        carrier_prices = list(carrier_min_fares.values())
        if not carrier_prices:
            return None

        carrier_prices_arr = np.array(carrier_prices, dtype=np.float64)

        # Step 4: Compute representative estimator across carriers
        est_upper = estimator.upper()
        if est_upper == "MEDIAN":
            rep_price = float(np.median(carrier_prices_arr))
        elif est_upper == "MEAN":
            rep_price = float(np.mean(carrier_prices_arr))
        elif est_upper == "TRIMMED_MEAN":
            # 10% symmetric trim if >= 5 observations, else standard median
            if len(carrier_prices_arr) >= 5:
                low = np.percentile(carrier_prices_arr, 10)
                high = np.percentile(carrier_prices_arr, 90)
                trimmed = carrier_prices_arr[
                    (carrier_prices_arr >= low) & (carrier_prices_arr <= high)
                ]
                rep_price = float(np.mean(trimmed))
            else:
                rep_price = float(np.median(carrier_prices_arr))
        else:
            rep_price = float(np.median(carrier_prices_arr))

        # Diagnostic statistical metrics
        return {
            "representative_price": round(rep_price, 2),
            "price_field": price_field,
            "estimator": est_upper,
            "carrier_count": len(carrier_min_fares),
            "total_observations_evaluated": len(valid_quotes),
            "carrier_fares": {c: round(f, 2) for c, f in carrier_min_fares.items()},
            "min_carrier_price": round(float(np.min(carrier_prices_arr)), 2),
            "max_carrier_price": round(float(np.max(carrier_prices_arr)), 2),
            "std_carrier_price": round(float(np.std(carrier_prices_arr)), 2)
            if len(carrier_prices_arr) > 1
            else 0.0,
            "p25": round(float(np.percentile(carrier_prices_arr, 25)), 2),
            "p75": round(float(np.percentile(carrier_prices_arr, 75)), 2),
        }
