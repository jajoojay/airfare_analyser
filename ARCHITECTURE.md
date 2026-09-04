# Architecture & System Design (APIX-2.0)

> Technical reference architecture for the India Airfare Price Observatory (MoSPI / NSO).

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION & CONSUMPTION                             |
|  Next.js 14 Observatory Dashboard             FastAPI Core & Export REST Endpoints|
|  (Origin Dark Aesthetic: 9 PRD Screens)        (/api/v1/index, /lead-time, /export)|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        ACCESS CONTROL & RATE LIMITING                             |
|  Token Bucket / Sliding Window IP Limiter (120 req/min API, 20 req/min Export)    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                           STATISTICAL COMPUTATION ENGINE                          |
|  - Lowest-Economy Estimator (packages/statistics/estimators.py)                   |
|  - DGCA Passenger Weight Engine (packages/statistics/weights.py)                  |
|  - Daily Laspeyres Index Engine (services/index_engine/calculator_service.py)     |
|  - Temporal Aggregations: Weekly & Monthly (temporal_aggregations.py)             |
|  - MoSPI Directional Co-Movement Matcher (benchmark_matcher.py)                   |
|  - ATF Jet Fuel Macro Context Engine (fuel_context.py)                            |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         DATA QUALITY GATE (PRD SEC 62)                            |
|  Cabin class filter (Economy Y), Price range bounds, Route matching, Deduplication|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         INGESTION & COLLECTION WORKFLOW                           |
|  - APScheduler 50-Job Cyclic Scheduler (services/scheduler/)                      |
|  - Circuit Breakers & Exponential Backoff Retries (circuit_breaker.py)            |
|  - Source Compliance & Permission State-Machine (source_registry.py)              |
|  - SHA-256 Tamper-Evident Raw Payload Storage (payload_store.py)                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             STORAGE & PERSISTENCE                                 |
|  Dual-Engine: PostgreSQL/TimescaleDB with automatic fallback to local SQLite      |
|  14 Normalized Tables: routes, airlines, fare_observations, index_values, etc.   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Ingestion & Collection Layer
- **Source Registry:** Implements a strict permission state machine (`DISCOVERED` $\rightarrow$ `REVIEW_REQUIRED` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE`). Unapproved sources cannot be scheduled.
- **Circuit Breaker:** Tracks consecutive errors per source. Trips from `CLOSED` to `OPEN` after 5 failures, protecting upstream airline servers and system reliability.
- **Payload Immutability:** Raw API/HTML responses are saved with SHA-256 hashes in `data/raw/` before parsing. Tamper detection guarantees scientific reproducibility.

---

## 3. Statistical Calculation Pipeline
1. **Raw Collection:** Collects lowest quotes across 5 horizons ($T+1, T+7, T+14, T+30, T+45$).
2. **Quality Verification:** Rule-based filtering (PRD Sec 62) drops invalid fares, anomalies, and duplicates.
3. **Representative Price:** For each route, carrier, and date, the lowest economy fare is selected. The cross-carrier median represents the route price $P_{j,t,14}$.
4. **DGCA Route Weighting:** Aggregates bidirectional passenger traffic across 10 corridors, strictly normalized so $\sum w_j = 1.000000$.
5. **Headline Index Calculation:** Computed using the Modified Laspeyres formulation anchored at $T+14$.
6. **Benchmark Validation:** Frequency-matched monthly aggregation evaluated against official MoSPI CPI Airfare series.
