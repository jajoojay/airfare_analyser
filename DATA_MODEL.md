# Data Model & Database Architecture

> Database schema specifications for the India Airfare Price Observatory (APIX-2.0).

---

## 1. Dual-Engine Architecture
The observatory supports **PostgreSQL / TimescaleDB** in production environments and automatically falls back to local **SQLite** (`airfare_observatory.db`) in standalone development mode. All schema tables, foreign keys, indexes, and migrations are 100% compatible with both engines.

---

## 2. Core Entities & Tables

### 1. `routes`
- `id` (Integer, Primary Key)
- `origin` (String: Delhi, Mumbai, etc.)
- `destination` (String: Mumbai, Bengaluru, etc.)
- `origin_airport` (String: DEL, BOM, etc.)
- `destination_airport` (String: BOM, BLR, etc.)
- `route_code` (String: DEL-BOM, unique)
- `corridor_type` (String: METRO_TRUNK, REGIONAL_THIN)
- `active` (Boolean)

### 2. `airlines`
- `id` (Integer, Primary Key)
- `code` (String: 6E, AI, SG, QP, IX)
- `name` (String: IndiGo, Air India, etc.)
- `is_scheduled` (Boolean)
- `active` (Boolean)

### 3. `sources`
- `id` (Integer, Primary Key)
- `name` (String)
- `base_url` (String)
- `access_method` (String: PLAYWRIGHT, REST_API, PUBLIC_SCRAPE)
- `permission_status` (String: REVIEW_REQUIRED, APPROVED, REJECTED)
- `rate_limit` (Integer: requests per minute)
- `health_status` (String: HEALTHY, WARNING, DEGRADED, DOWN)
- `enabled` (Boolean)

### 4. `raw_payloads`
- `id` (Integer, Primary Key)
- `source_id` (Integer, Foreign Key)
- `payload_uri` (String: file path under `data/raw/`)
- `payload_hash` (String: SHA-256 hex digest)
- `content_type` (String: application/json)

### 5. `fare_observations` (TimescaleDB Hypertable)
- `id` (Integer, Primary Key)
- `route_id` (Integer, Foreign Key)
- `airline_id` (Integer, Foreign Key)
- `search_timestamp` (DateTime, indexed)
- `travel_date` (Date, indexed)
- `advance_purchase_days` (Integer: 1, 7, 15, 30, 45)
- `flight_number` (String)
- `cabin_class` (String: ECONOMY)
- `fare_family` (String: BASIC, FLEXI)
- `base_fare` (Float, INR)
- `fuel_surcharge` (Float, INR)
- `tax_amount` (Float, GST)
- `development_fee` (Float, UDF/ADF)
- `convenience_fee` (Float, INR)
- `total_fare` (Float, INR)
- `is_synthetic` (Boolean: Provenance flag)
- `quality_score` (Float: 0–100)
- `quality_status` (String: ACCEPT, WARNING, REJECT)

### 6. `index_values`
- `id` (Integer, Primary Key)
- `index_series` (String: BASE_FARE, TOTAL_PRICE)
- `index_type` (String: HEADLINE_T15, SUB_T1, SUB_T7, SUB_T15, SUB_T30, SUB_T45, ROUTE_LEVEL)
- `lead_time_days` (Integer: 15)
- `period_start` (Date, indexed)
- `period_end` (Date)
- `route_id` (Integer, Nullable — null for national aggregate)
- `index_value` (Float)
- `daily_change_pct` (Float)
- `weekly_change_pct` (Float)
- `monthly_change_pct` (Float)
- `coverage_rate` (Float: 0–100)
- `methodology_version` (String: APIX-2.0)

### 7. `route_weights`
- `id` (Integer, Primary Key)
- `route_id` (Integer, Foreign Key)
- `passenger_volume` (Float)
- `weight` (Float: normalized sum = 1.0)
- `period` (String: 2026-Q1)
- `effective_from` (Date)
- `effective_to` (Date, Nullable)

### 8. `benchmark_values`
- `id` (Integer, Primary Key)
- `period` (String: YYYY-MM)
- `indicator` (String: CPI_AIRFARE_DOMESTIC)
- `value` (Float)
- `base_year` (String: 2012=100)
- `source` (String: MoSPI / NSO)

### 9. `atf_prices` & `atf_tax_rates`
- `location` (String: Delhi, Mumbai, Kolkata, Chennai)
- `date` (Date)
- `price_per_kl` (Float, INR per kL)
- `tax_type` (String: CENTRAL_EXCISE, STATE_VAT)
- `rate` (Float: percentage)
