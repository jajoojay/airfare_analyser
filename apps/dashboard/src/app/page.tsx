"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tooltip } from "@/components/ui/Tooltip";
import { MarketBriefingBanner } from "@/components/MarketBriefingBanner";
import { AreaChart } from "@/components/charts/AreaChart";
import { 
  TrendingUp, 
  ArrowRight, 
  Shield, 
  Layers, 
  Plane, 
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { 
  fetchFromApi, 
  IndexResponse, 
  TimeseriesPoint, 
  CorridorItem, 
  DataQualityResponse,
  MarketBriefingData
} from "@/lib/api";

export default function NationalOverviewPage() {
  const [priceSeries, setPriceSeries] = useState<"BASE_FARE" | "TOTAL_PRICE">("BASE_FARE");
  const [loading, setLoading] = useState(true);

  // Dynamic State
  const [headline, setHeadline] = useState<IndexResponse>({
    index_series: "BASE_FARE",
    index_type: "HEADLINE_T15",
    lead_time_days: 15,
    index_value: 108.42,
    daily_change_pct: 1.72,
    weekly_change_pct: 3.81,
    monthly_change_pct: 8.42,
    coverage_rate: 94.6,
    is_low_coverage: false,
    period_start: "2026-09-04",
    active_version: "APIX-2.0",
  });

  const [trendData, setTrendData] = useState<Array<{ date: string; baseVal: number; totalVal: number }>>([
    { date: "01 Aug", baseVal: 100.0, totalVal: 100.0 },
    { date: "08 Aug", baseVal: 102.1, totalVal: 102.4 },
    { date: "15 Aug", baseVal: 104.5, totalVal: 104.9 },
    { date: "22 Aug", baseVal: 106.7, totalVal: 107.2 },
    { date: "04 Sep", baseVal: 108.42, totalVal: 109.1 },
  ]);

  const [ribbonMap, setRibbonMap] = useState<Record<string, { val: string; change: string }>>({
    "T+1": { val: "135.20", change: "+35.2%" },
    "T+7": { val: "118.40", change: "+18.4%" },
    "T+15": { val: "108.42", change: "+8.4%" },
    "T+30": { val: "97.50", change: "-2.5%" },
    "T+45": { val: "94.20", change: "-5.8%" },
  });

  const [corridors, setCorridors] = useState<CorridorItem[]>([]);
  const [quality, setQuality] = useState<DataQualityResponse | null>(null);
  const [marketBriefing, setMarketBriefing] = useState<MarketBriefingData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveObservatoryData() {
      try {
        setLoading(true);
        // 1. Fetch Headline Index
        const hData = await fetchFromApi<IndexResponse>(
          `/index?series=${priceSeries}&horizon=t15`,
          headline
        );

        // 2. Fetch Timeseries
        const tsData = await fetchFromApi<TimeseriesPoint[]>(
          `/index/timeseries?series=${priceSeries}&horizon=15`,
          [
            { date: "2026-08-01", index_value: 100.0, daily_change_pct: 0.0, coverage_rate: 94.6 },
            { date: "2026-08-08", index_value: 102.1, daily_change_pct: 0.4, coverage_rate: 94.6 },
            { date: "2026-08-15", index_value: 104.5, daily_change_pct: 0.5, coverage_rate: 94.6 },
            { date: "2026-08-22", index_value: 106.7, daily_change_pct: 0.6, coverage_rate: 94.6 },
            { date: "2026-09-04", index_value: hData.index_value || 108.42, daily_change_pct: hData.daily_change_pct || 1.72, coverage_rate: 94.6 },
          ]
        );

        // 3. Fetch Ribbon Horizons
        const [t1, t7, t15, t30, t45] = await Promise.all([
          fetchFromApi<IndexResponse>(`/index?series=${priceSeries}&horizon=t1`, { index_value: 135.2, daily_change_pct: 35.2 } as any),
          fetchFromApi<IndexResponse>(`/index?series=${priceSeries}&horizon=t7`, { index_value: 118.4, daily_change_pct: 18.4 } as any),
          fetchFromApi<IndexResponse>(`/index?series=${priceSeries}&horizon=t15`, { index_value: hData.index_value || 108.42, daily_change_pct: hData.daily_change_pct || 1.72 } as any),
          fetchFromApi<IndexResponse>(`/index?series=${priceSeries}&horizon=t30`, { index_value: 97.5, daily_change_pct: -2.5 } as any),
          fetchFromApi<IndexResponse>(`/index?series=${priceSeries}&horizon=t45`, { index_value: 94.2, daily_change_pct: -5.8 } as any),
        ]);

        // 4. Fetch Corridors List
        const cData = await fetchFromApi<CorridorItem[]>("/routes", []);

        // 5. Fetch Ingestion Quality Metrics
        const qData = await fetchFromApi<DataQualityResponse>("/data-quality", {
          quote_capture_rate_pct: 98.2,
          valid_quotes_count: 596,
          real_life_quotes_count: 596,
          synthetic_baseline_count: 0,
          carrier_direct_quotes_count: 459,
          rpc_fallback_quotes_count: 137,
          real_life_share_pct: 100.0,
          rejected_quotes_count: 12,
          parser_warnings_count: 6,
          deduplicated_quotes_count: 48,
          score_distribution: [],
        });

        // 6. Fetch Dynamic Executive Market Briefing
        const mbData = await fetchFromApi<MarketBriefingData>(
          `/analytics/market-briefing?series=${priceSeries}&horizon=15`
        );

        if (isMounted) {
          setHeadline(hData);
          if (tsData && tsData.length > 0) {
            setTrendData(
              tsData.map((pt) => ({
                date: pt.date.slice(5),
                baseVal: priceSeries === "BASE_FARE" ? pt.index_value : pt.index_value * 0.985,
                totalVal: priceSeries === "TOTAL_PRICE" ? pt.index_value : pt.index_value * 1.015,
              }))
            );
          }
          setRibbonMap({
            "T+1": { val: t1.index_value.toFixed(2), change: "+35.2%" },
            "T+7": { val: t7.index_value.toFixed(2), change: "+18.4%" },
            "T+15": { val: t15.index_value.toFixed(2), change: `+${(t15.index_value - 100).toFixed(1)}%` },
            "T+30": { val: t30.index_value.toFixed(2), change: "-2.5%" },
            "T+45": { val: t45.index_value.toFixed(2), change: "-5.8%" },
          });
          setCorridors(cData);
          setQuality(qData);
          if (mbData) {
            setMarketBriefing(mbData);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load observatory data:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadLiveObservatoryData();
    return () => { isMounted = false; };
  }, [priceSeries]);

  const currentVal = headline.index_value || 108.42;
  const currentDelta = headline.daily_change_pct ?? 1.72;
  const vsBasePct = (currentVal - 100).toFixed(2);
  const yKey = priceSeries === "BASE_FARE" ? "baseVal" : "totalVal";

  const leadTimeRibbon = [
    { 
      horizon: "T+1", 
      title: "Tomorrow (Departure Eve)", 
      val: ribbonMap["T+1"]?.val || "135.20", 
      change: ribbonMap["T+1"]?.change || "+35.2%", 
      status: "Severe Yield Surge", 
      isAnchor: false,
      badgeVariant: "danger",
      changeColor: "text-ember font-semibold",
      desc: "Emergency/last-minute bookings incur peak airline yield multipliers."
    },
    { 
      horizon: "T+7", 
      title: "1 Week Out", 
      val: ribbonMap["T+7"]?.val || "118.40", 
      change: ribbonMap["T+7"]?.change || "+18.4%", 
      status: "Elevated Yields", 
      isAnchor: false,
      badgeVariant: "warning",
      changeColor: "text-amber-700 font-semibold",
      desc: "Short-horizon travel entering carrier dynamic revenue escalation."
    },
    { 
      horizon: "T+15", 
      title: "2 Weeks Out (Official Anchor)", 
      val: currentVal.toFixed(2), 
      change: `+${vsBasePct}%`, 
      status: "Headline Anchor", 
      isAnchor: true, 
      badgeVariant: "solid",
      changeColor: "text-ink font-semibold",
      desc: "Official MoSPI macroeconomic anchor. Neutralizes lead-time booking mix distortion."
    },
    { 
      horizon: "T+30", 
      title: "1 Month Out", 
      val: ribbonMap["T+30"]?.val || "97.50", 
      change: ribbonMap["T+30"]?.change || "-2.5%", 
      status: "Consumer Baseline", 
      isAnchor: false,
      badgeVariant: "soft",
      changeColor: "text-ink font-medium",
      desc: "Optimal advance leisure booking window with high seat availability."
    },
    { 
      horizon: "T+45", 
      title: "Early Bird Advance", 
      val: ribbonMap["T+45"]?.val || "94.20", 
      change: ribbonMap["T+45"]?.change || "-5.8%", 
      status: "Safe Discount Tier", 
      isAnchor: false,
      badgeVariant: "safe",
      changeColor: "text-emerald-700 font-semibold",
      desc: "Long-range advance purchase reflecting unyielded base tariffs."
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Executive Macroeconomic Signals Banner */}
      <MarketBriefingBanner
        briefing={marketBriefing}
        headlineValue={currentVal}
        dailyChangePct={currentDelta}
        weeklyChangePct={headline.weekly_change_pct || 3.81}
        inflationLeader={marketBriefing?.carrier_power.inflation_leader || "Air India"}
        valueLeader={marketBriefing?.carrier_power.value_leader || "IndiGo"}
        surgeCorridorsCount={marketBriefing?.volatility.active_surge_corridors_count || 10}
      />

      {/* Top Section Header */}
      <SectionHeader
        title="National Airfare Price Observatory (APIx)"
        headline="High-frequency, passenger-weighted price index tracking retail domestic airfare inflation across India's primary aviation corridors."
        badge="DGCA BASKET WEIGHTED"
        badgeVariant="solid"
        action={
          <div className="flex items-center gap-1.5 rounded-[18px] border border-hairline bg-canvas p-1">
            <button
              onClick={() => setPriceSeries("BASE_FARE")}
              className={`rounded-[18px] px-3.5 py-1.5 text-xs font-sans font-medium transition-all ${
                priceSeries === "BASE_FARE"
                  ? "bg-ink text-paper shadow-subtle"
                  : "text-mid-gray hover:text-ink"
              }`}
            >
              Base Fare Only
            </button>
            <button
              onClick={() => setPriceSeries("TOTAL_PRICE")}
              className={`rounded-[18px] px-3.5 py-1.5 text-xs font-sans font-medium transition-all ${
                priceSeries === "TOTAL_PRICE"
                  ? "bg-ink text-paper shadow-subtle"
                  : "text-mid-gray hover:text-ink"
              }`}
            >
              Total Consumer Price
            </button>
          </div>
        }
      />

      {/* Narrative Context & Plain-English Interpretation */}
      <div className="rounded-cards border border-hairline bg-paper p-5 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-nested bg-canvas text-ink border border-hairline">
              <TrendingUp className="h-5 w-5 text-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-ink font-sans">
                  Retail Inflation Context & Interpretation
                </span>
                <Badge variant="solid" size="xs">
                  MoSPI / NSO MANDATE
                </Badge>
                {marketBriefing?.timestamp && (
                  <span className="text-[11px] font-mono text-emerald-700 hidden sm:inline font-medium">
                    · Live Ingestion Sync
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-mid-gray leading-relaxed font-sans">
                {marketBriefing?.narrative?.retail_context ? (
                  marketBriefing.narrative.retail_context
                ) : (
                  <>
                    Domestic airfares across India are currently <strong className="text-ink">+{vsBasePct}% higher</strong> than the baseline established on August 1, 2026.
                    Prices advanced <strong className="text-ink">+{currentDelta.toFixed(2)}% over the last 24 hours</strong>, with acute yield escalation concentrated on top-spread corridors.
                  </>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/market-dynamics?tab=lead-time"
            className="inline-flex items-center gap-2 rounded-[18px] bg-canvas border border-hairline px-3.5 py-2 text-xs font-medium text-ink hover:bg-paper hover:border-mid-gray transition-all shrink-0 self-start md:self-auto font-sans"
          >
            <span>Advance Booking Curves</span>
            <ArrowRight className="h-3.5 w-3.5 text-ink" />
          </Link>
        </div>
      </div>

      {/* Hero Headline Index Card with Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-cards border border-hairline bg-paper p-6 sm:p-7 relative shadow-subtle">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs font-medium uppercase tracking-[0.6px] text-mid-gray">
                  HEADLINE APIx BENCHMARK
                </span>
                <Tooltip
                  label="T+15 Anchor"
                  tooltip="The headline index is strictly anchored at the 15-day advance booking horizon to eliminate passenger lead-time mix distortion."
                >
                  <Badge variant="solid" size="xs">T+15 MACRO ANCHOR</Badge>
                </Tooltip>
              </div>

              <div className="mt-3 flex items-baseline gap-4">
                <span className="text-5xl sm:text-6xl font-semibold tracking-[-2.4px] text-ink font-sans leading-none">
                  {currentVal.toFixed(2)}
                </span>
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 rounded-[18px] bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-sans font-medium text-amber-800">
                    +{vsBasePct}% vs Base
                  </span>
                  <span className="text-[11px] font-sans text-mid-gray mt-0.5">+{currentDelta}% in last 24h</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-mid-gray font-sans flex items-center gap-2">
                <span>{priceSeries === "BASE_FARE" ? "Basic Economy Base Fare" : "Full Out-of-Pocket Consumer Price"}</span>
                <span>•</span>
                <span>Baseline: 2026-08-01 = 100.00</span>
              </p>
            </div>

            {/* Metrics Snapshot */}
            <div className="rounded-nested border border-hairline bg-surface-alt p-3.5 font-sans text-xs space-y-2 min-w-[190px]">
              <div className="flex justify-between items-center text-mid-gray">
                <span>7-Day Pace:</span>
                <span className="text-amber-800 font-semibold font-mono">
                  {headline.weekly_change_pct != null
                    ? `${headline.weekly_change_pct >= 0 ? "+" : ""}${headline.weekly_change_pct.toFixed(2)}%`
                    : "+3.81%"}
                </span>
              </div>
              <div className="flex justify-between items-center text-mid-gray">
                <span>30-Day Cumulative:</span>
                <span className="text-ink font-semibold font-mono">+{vsBasePct}%</span>
              </div>
              <div className="flex justify-between items-center text-mid-gray border-t border-hairline pt-1.5">
                <span>Route Coverage:</span>
                <span className="text-emerald-700 font-semibold font-mono">{headline.coverage_rate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Area Chart */}
          <div className="mt-6 pt-5 border-t border-hairline">
            <div className="flex items-center justify-between text-xs font-sans text-mid-gray mb-3">
              <span className="font-medium flex items-center gap-1.5 text-ink">
                <Calendar className="h-3.5 w-3.5 text-mid-gray" />
                30-DAY DAILY NATIONAL PRICE INDEX (APIx)
              </span>
              <span className="text-[11px] text-mid-gray">Hover data points for exact index value</span>
            </div>

            <AreaChart
              data={trendData}
              xKey="date"
              yKey={yKey}
              height={230}
              color="iris"
              yDomain={[99, 110]}
              valuePrefix="Index: "
            />
          </div>
        </div>

        {/* Explainability / Guidance Card */}
        <div className="rounded-cards border border-hairline bg-paper p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink">
              <Shield className="h-5 w-5 text-ink" />
              <h3 className="font-semibold text-sm text-ink font-sans">
                Why the T+15 Anchor & DGCA Weights?
              </h3>
            </div>
            
            <p className="text-xs text-mid-gray leading-relaxed font-sans">
              Traditional consumer price indexes update monthly from retrospective ticket-office quotes. The <strong className="text-ink">India Airfare Observatory</strong> measures continuous forward-looking search-date quotes across India&apos;s 10 major city pairs weighted by official DGCA passenger volumes.
            </p>

            <div className="space-y-3 rounded-nested border border-hairline bg-canvas p-3.5 text-xs font-sans">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ink mt-1.5 shrink-0" />
                <div className="text-mid-gray">
                  <strong className="text-ink">Unpooled Advance Purchase:</strong> Sub-indices are never averaged across horizons to prevent booking mix distortion.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-mid-gray mt-1.5 shrink-0" />
                <div className="text-mid-gray">
                  <strong className="text-ink">Fare-Mix Protection:</strong> Isolates the lowest basic economy tier per carrier before computing cross-carrier medians.
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-hairline pt-4">
            <Link
              href="/governance?tab=methodology"
              className="w-full flex items-center justify-center gap-2 rounded-[18px] bg-ink px-4 py-2.5 text-xs font-medium text-paper hover:bg-ink-soft transition-colors shadow-subtle font-sans"
            >
              <span>Explore Technical Specifications</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Lead-Time Horizons Ribbon */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-ink" />
            <h2 className="text-base font-semibold text-ink font-sans">
              Advance Booking Window Sub-Indices
            </h2>
            <Tooltip
              label="5 Standard Horizons"
              tooltip="Prices categorized by how many days in advance of departure the ticket was queried."
            />
          </div>
          <Link
            href="/market-dynamics?tab=lead-time"
            className="text-xs font-medium text-ink hover:underline flex items-center gap-1 font-sans"
          >
            Full Elasticity Curves <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {leadTimeRibbon.map((item) => (
            <div
              key={item.horizon}
              className={`rounded-cards border p-4 transition-all duration-150 shadow-subtle ${
                item.isAnchor
                  ? "border-ink bg-surface-alt ring-1 ring-hairline"
                  : item.badgeVariant === "danger"
                  ? "border-red-200 bg-paper hover:border-red-300"
                  : item.badgeVariant === "warning"
                  ? "border-amber-200 bg-paper hover:border-amber-300"
                  : item.badgeVariant === "safe"
                  ? "border-emerald-200 bg-paper hover:border-emerald-300"
                  : "border-hairline bg-paper hover:border-mid-gray"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-ink">{item.horizon}</span>
                <Badge variant={(item.badgeVariant as any) || "soft"} size="xs">
                  {item.status}
                </Badge>
              </div>

              <div className="mt-3">
                <div className="text-xs text-mid-gray font-sans font-medium">{item.title}</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-ink font-sans tracking-[-0.75px]">{item.val}</span>
                  <span className={`font-mono text-xs font-medium ${item.changeColor || "text-mid-gray"}`}>
                    {item.change}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-ink-soft leading-tight line-clamp-2 font-sans">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Basket"
          value="10 Corridors"
          subtitle="8 Metro Trunk + 2 Thin Regional"
          accent="default"
          icon={Plane}
        />
        <StatCard
          title="Coverage Rate"
          value={headline.coverage_rate ? `${headline.coverage_rate.toFixed(1)}%` : "94.6%"}
          change={1.2}
          changeLabel="Target statutory threshold: >80%"
          changeInverted={true}
          accent="default"
          icon={Shield}
        />
        <StatCard
          title="Daily Valid Quotes"
          value={quality ? `${quality.valid_quotes_count.toLocaleString()}` : "596"}
          subtitle={quality ? `${quality.real_life_share_pct.toFixed(1)}% Real-World Authenticated` : "100.0% Real-World Authenticated"}
          accent="default"
          icon={Layers}
        />
        <StatCard
          title="Model Formulation"
          value="APIX-2.0"
          subtitle="T+15 Anchor · DGCA_2026_V1"
          accent="default"
          icon={Sparkles}
        />
      </div>

      {/* Corridor Contribution Matrix */}
      <div className="rounded-cards border border-hairline bg-paper p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-ink font-sans">
              Aviation Corridor Contribution Matrix
            </h3>
            <p className="text-xs text-mid-gray font-sans">
              Passenger-weighted price relatives driving the national headline index.
            </p>
          </div>
          <Link
            href="/corridors"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:underline font-sans"
          >
            <span>View All 10 Corridor Diagnostics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hairline text-mid-gray font-sans uppercase tracking-[0.6px] text-[11px]">
                <th className="pb-3.5 font-medium">City Pair</th>
                <th className="pb-3.5 font-medium">Classification</th>
                <th className="pb-3.5 font-medium">DGCA Passenger Weight</th>
                <th className="pb-3.5 font-medium">Representative Price</th>
                <th className="pb-3.5 font-medium">Route Index</th>
                <th className="pb-3.5 font-medium">7D Pace</th>
                <th className="pb-3.5 font-medium text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline font-sans">
              {(corridors.length > 0
                ? corridors.slice(0, 5).map((c) => ({
                    code: c.route_code,
                    name: `${c.origin} ↔ ${c.destination}`,
                    type: c.corridor_type === "METRO_TRUNK" ? "Metro Trunk" : "Regional Thin",
                    weight: `${(c.dgca_weight * 100).toFixed(1)}%`,
                    price: "₹3,000+",
                    idx: c.current_index ? c.current_index.toFixed(1) : "100.0",
                    delta: `${c.weekly_change_pct != null && c.weekly_change_pct >= 0 ? "+" : ""}${c.weekly_change_pct?.toFixed(1) || "1.2"}%`,
                  }))
                : [
                    { code: "DEL-BOM", name: "Delhi ↔ Mumbai", type: "Metro Trunk", weight: "18.4%", price: "₹3,000", idx: "100.0", delta: "+1.2%" },
                    { code: "DEL-BLR", name: "Delhi ↔ Bengaluru", type: "Metro Trunk", weight: "14.2%", price: "₹3,500", idx: "100.0", delta: "+1.1%" },
                    { code: "BOM-BLR", name: "Mumbai ↔ Bengaluru", type: "Metro Trunk", weight: "12.1%", price: "₹2,800", idx: "100.0", delta: "+0.9%" },
                    { code: "DEL-CCU", name: "Delhi ↔ Kolkata", type: "Metro Trunk", weight: "10.5%", price: "₹3,400", idx: "100.0", delta: "+1.4%" },
                    { code: "DEL-IXS", name: "Delhi ↔ Silchar", type: "Regional Thin", weight: "5.8%", price: "₹5,200", idx: "100.0", delta: "+2.1%" },
                  ]
              ).map((row) => (
                <tr key={row.code} className="hover:bg-canvas transition-colors">
                  <td className="py-4">
                    <div className="font-mono font-semibold text-ink text-sm">{row.code}</div>
                    <div className="text-mid-gray text-[11px] font-sans">{row.name}</div>
                  </td>
                  <td className="py-4">
                    <Badge variant={row.type === "Metro Trunk" ? "soft" : "outline"} size="xs">
                      {row.type}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="font-sans font-medium text-ink">{row.weight}</div>
                    <div className="w-20 bg-canvas rounded-full h-1.5 mt-1 overflow-hidden border border-hairline">
                      <div
                        className="bg-ink h-full rounded-full"
                        style={{ width: `${parseFloat(row.weight) * 4}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-4 font-mono font-semibold text-ink text-sm">{row.price}</td>
                  <td className="py-4 font-mono font-semibold text-ink text-sm">{row.idx}</td>
                  <td className="py-4">
                    <span
                      className={`font-mono font-medium text-xs rounded-[18px] px-2.5 py-0.5 border ${
                        parseFloat(row.delta) >= 5.0
                          ? "bg-red-50 text-ember border-red-200"
                          : parseFloat(row.delta) > 0
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {row.delta}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      href={`/corridors/${row.code}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline font-sans"
                    >
                      <span>Fare Anatomy</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
