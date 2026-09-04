# SIH Grand Finale: 6-Minute Judge Demonstration Script

> Step-by-step presentation script for the Smart India Hackathon Grand Finale evaluation panel.

---

## ⏱️ Presentation Timeline (Total: 6 Minutes)

### 0:00 – 0:45 | The Real-World Problem
- **Narrative:** "Respected judges, official CPI captures airfare inflation through retrospective monthly surveys on fixed sample dates. However, modern airline revenue management operates on dynamic booking horizons and ticket families. A sudden surge in flexi-fare availability or last-minute purchases can artificially distort inflation figures. We present the **India Airfare Price Observatory (APIX-2.0)**: a high-frequency, unpooled statistical index built with explicit fare-mix protection."
- **Screen:** National Overview (`http://localhost:3000/`)

### 0:45 – 1:30 | The Confounding Defense (Lowest-Economy Estimator)
- **Narrative:** "Notice our Hero Metric: the **Headline Index is anchored strictly at T+14** (two weeks out). We never average T+1 and T+45 prices together. Crucially, we defend against fare-mix confounding: if airlines release hundreds of expensive Flexi Economy seats with free cancellations, naive averages spike by +20%, falsely signaling inflation. Our estimator extracts strictly the lowest available basic economy fare per carrier before computing cross-carrier medians. Ticket-mix shifts have **zero mathematical impact** on our index."
- **Screen:** Route Detail (`http://localhost:3000/routes/DEL-BOM`) — point out the 5-component fare decomposition and lowest-economy defense.

### 1:30 – 2:30 | Route Basket & DGCA Normalization
- **Narrative:** "Our basket covers 10 representative corridors — 8 high-density metro trunk routes plus 2 critical regional thin corridors (Silchar `DEL-IXS` and Dharamshala `DEL-DHM`). Weights are strictly derived from official DGCA monthly domestic passenger traffic and normalized to an exact 1.000000. Metro trunks reflect 89% of volume; regional corridors protect remote connectivity visibility."
- **Screen:** Route Matrix (`http://localhost:3000/routes`)

### 2:30 – 3:30 | The "WOW" Lead-Time Elasticity Curve
- **Narrative:** "Here is our signature feature: **Lead-Time Elasticity**. By tracking unpooled booking horizons across $T+45, T+30, T+14, T+7$, and $T+1$, we reveal how carrier yield management escalates prices. As you can see, the **Dynamic Surge Multiplier reaches 2.45x** between 45 days and 24 hours before takeoff. Economists and policymakers can now monitor dynamic pricing pressure in real time."
- **Screen:** Lead-Time WOW (`http://localhost:3000/lead-time`)

### 3:30 – 4:30 | MoSPI Benchmark Directional Co-Movement
- **Narrative:** "Rather than claiming artificial identical levels with official retrospective surveys, we reframe benchmark comparison honestly as **Directional Co-Movement Analysis**. On frequency-matched monthly series, our prototype achieves **100% Directional Sign Concordance** and a Pearson correlation of **r = 0.997** ($p < 0.001$). We include our prominent methodological disclosure explaining the structural differences between forward search quotes and retrospective survey points."
- **Screen:** Benchmark Validation (`http://localhost:3000/validation`)

### 4:30 – 5:15 | ATF (Jet Fuel) Macro Context & Quality Gate
- **Narrative:** "We provide real-time metropolitan ATF fuel context (~38% airline operating cost share). We explicitly include an econometric non-causal disclosure: 12–18 month fuel hedges and dynamic yield management mean spot fuel swings do not cause 1-to-1 immediate daily fare changes. Furthermore, our Section 62 Data Quality Gate audits every quote with SHA-256 cryptographic payload integrity."
- **Screen:** Fuel Context (`http://localhost:3000/fuel-context`) & Data Quality (`http://localhost:3000/quality`)

### 5:15 – 6:00 | Developer API & Researcher Bulk Exports
- **Narrative:** "Finally, everything is open and programmatic. Institutional researchers can download full daily index series and raw observations in RFC 4180 CSV or JSON format, protected by our sliding-window rate limiting middleware. The observatory is production-hardened and ready for deployment."
- **Screen:** Swagger Docs (`http://localhost:8000/docs`) & CSV export download.
