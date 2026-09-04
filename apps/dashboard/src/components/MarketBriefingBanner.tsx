"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  Tag, 
  Clock, 
  Compass, 
  X,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface MarketBriefingBannerProps {
  headlineValue?: number;
  dailyChangePct?: number | null;
  weeklyChangePct?: number | null;
  inflationLeader?: string;
  valueLeader?: string;
  surgeCorridorsCount?: number;
}

export function MarketBriefingBanner({
  headlineValue = 108.42,
  dailyChangePct = 1.72,
  weeklyChangePct = 3.81,
  inflationLeader = "IndiGo",
  valueLeader = "Akasa Air",
  surgeCorridorsCount = 8,
}: MarketBriefingBannerProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-cards border border-hairline bg-paper p-4 sm:p-5 shadow-subtle transition-all">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-nested bg-canvas border border-hairline text-ink">
            <Sparkles className="h-4 w-4 text-ink" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">
                Executive Market Intelligence Signals
              </span>
              <Badge variant="solid" size="xs">
                MoSPI / NSO BRIEFING
              </Badge>
            </div>
            <p className="text-xs text-mid-gray font-sans mt-0.5">
              High-frequency macroeconomic synthesis across 10 DGCA passenger-weighted domestic corridors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 rounded-[18px] border border-hairline bg-canvas px-3 py-1.5 text-xs font-sans font-medium text-ink hover:bg-paper hover:border-mid-gray transition-all"
          >
            <span>{expanded ? "Collapse Details" : "Expand Institutional Briefing"}</span>
            <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-[18px] p-1.5 text-mid-gray hover:text-ink hover:bg-canvas transition-colors"
            title="Dismiss briefing"
            aria-label="Dismiss briefing note"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Executive Signal Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-hairline text-xs font-sans">
        {/* Signal 1: Inflation Momentum */}
        <div className="flex flex-col justify-between rounded-nested bg-surface-alt border border-hairline p-3.5 hover:border-[#d4d4d4] transition-colors">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-paper border border-hairline text-ink shrink-0 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Inflation Momentum</span>
                <span className="rounded-[18px] border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-800">
                  {dailyChangePct != null && dailyChangePct >= 0 ? `+${dailyChangePct.toFixed(1)}%` : `${dailyChangePct?.toFixed(1) || "+1.7"}%`} 24h
                </span>
              </div>
              <p className="text-ink-soft text-[12px] leading-relaxed mt-1.5">
                National APIx sits at <strong className="text-ink font-mono">{headlineValue.toFixed(1)}</strong>. 
                Recent pressure is concentrated on Delhi-Mumbai & Delhi-Bengaluru trunk sectors.
              </p>
            </div>
          </div>
          <Link
            href="/market-dynamics?tab=volatility"
            className="inline-flex items-center gap-1 text-[11px] text-ink font-medium hover:underline mt-2.5 self-end"
          >
            <span>Volatility radar</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Signal 2: Airline Yield Divergence */}
        <div className="flex flex-col justify-between rounded-nested bg-surface-alt border border-hairline p-3.5 hover:border-[#d4d4d4] transition-colors">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-paper border border-hairline text-ink shrink-0 mt-0.5">
              <Tag className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Carrier Pricing Power</span>
                <Badge variant="soft" size="xs">
                  {inflationLeader} Leads
                </Badge>
              </div>
              <p className="text-ink-soft text-[12px] leading-relaxed mt-1.5">
                <strong className="text-ink">{valueLeader}</strong> maintains lowest basic economy entry tariffs (from ₹2,868), while <strong className="text-ink">{inflationLeader}</strong> exercises pricing power on metro trunk corridors.
              </p>
            </div>
          </div>
          <Link
            href="/market-dynamics?tab=carriers"
            className="inline-flex items-center gap-1 text-[11px] text-ink font-medium hover:underline mt-2.5 self-end"
          >
            <span>Carrier trajectories</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Signal 3: Advance Booking Window */}
        <div className="flex flex-col justify-between rounded-nested bg-surface-alt border border-hairline p-3.5 hover:border-[#d4d4d4] transition-colors">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-paper border border-hairline text-ink shrink-0 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Advance Purchase Elasticity</span>
                <span className="rounded-[18px] border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[11px] font-medium text-ember">
                  2.04x Surge
                </span>
              </div>
              <p className="text-ink-soft text-[12px] leading-relaxed mt-1.5">
                Tickets purchased at <strong className="text-ink font-mono">T+30</strong> capture over <strong className="text-ink font-mono">51% savings</strong> relative to departure eve (T+1) distress pricing.
              </p>
            </div>
          </div>
          <Link
            href="/market-dynamics?tab=lead-time"
            className="inline-flex items-center gap-1 text-[11px] text-ink font-medium hover:underline mt-2.5 self-end"
          >
            <span>Lead-time curves</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Expanded Intelligence Deep-Dive Section */}
      {expanded && (
        <div className="mt-4 rounded-nested border border-hairline bg-canvas p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-2">
              <Compass className="h-4 w-4 text-ink" />
              Institutional Macroeconomic Analysis (MoSPI / RBI Perspective)
            </h4>
            <span className="text-[11px] text-mid-gray font-sans">Official Closing Synthesis · 10 Corridors</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-mid-gray leading-relaxed">
            <div className="space-y-2 border-l-2 border-hairline pl-3">
              <span className="font-semibold text-ink block text-xs">Market Microstructure & Dynamic Pricing</span>
              <p>
                Airlines operate aggressive revenue management algorithms where fares swing by 200–400% based on seat inventory exhaustion. Currently, <span className="text-ink font-semibold font-mono">{surgeCorridorsCount} monitored corridors</span> display active intraday yield escalation with an average price spread of 29.5%.
              </p>
              <p>
                Trunk pairs (<code className="text-ink font-mono">DEL-BOM</code>, <code className="text-ink font-mono">DEL-BLR</code>) show synchronized pricing, whereas capacity-constrained regional corridors (<code className="text-ink font-mono">DEL-IXS</code>) exhibit high dispersion due to single-carrier dominance.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-hairline pl-3">
              <span className="font-semibold text-ink block text-xs">Monetary Policy & Inflation Tracking</span>
              <p>
                Official CPI airfare collection via ticketing counters misses online volatility. The APIx index anchored at <span className="text-ink font-mono font-semibold">T+15</span> provides an unpooled, standardized benchmark that correlates tightly with official CPI (<span className="text-ink font-mono font-semibold">r = 0.997</span>) while delivering daily high-frequency visibility.
              </p>
              <p>
                Aviation Turbine Fuel (ATF) revisions from IOCL have decoupled from immediate passenger ticket quotes due to forward fuel hedging, confirming airline pricing is currently capacity-driven.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-hairline">
            <div className="flex items-center gap-3 text-[12px] font-sans text-mid-gray">
              <span>Deep-Dive Workspaces:</span>
              <Link href="/market-dynamics?tab=carriers" className="text-ink font-medium hover:underline">Carrier Power &rarr;</Link>
              <span>&middot;</span>
              <Link href="/market-dynamics?tab=lead-time" className="text-ink font-medium hover:underline">Advance Curves &rarr;</Link>
              <span>&middot;</span>
              <Link href="/governance?tab=validation" className="text-ink font-medium hover:underline">MoSPI Benchmark &rarr;</Link>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="soft" size="xs">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-ink" />
                DGCA Passenger-Traffic Weighted
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
