"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { 
  ArrowRight, 
  Filter, 
  Flame, 
  Plane, 
  TrendingUp, 
  Search,
  Layers,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { fetchFromApi, CorridorItem } from "@/lib/api";

export default function CorridorsPage() {
  const [filterType, setFilterType] = useState<"ALL" | "METRO_TRUNK" | "REGIONAL_THIN">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const defaultCorridors = [
    { code: "DEL-BOM", name: "Delhi ↔ Mumbai", airports: "DEL - BOM", type: "METRO_TRUNK", weight: 18.4, idx: "100.0", d1: "0.0%", d7: "+1.2%", d30: "+4.5%", fare: "₹3,000", status: "NORMAL", carriers: "6E, AI, SG, QP", flights: 44 },
    { code: "DEL-BLR", name: "Delhi ↔ Bengaluru", airports: "DEL - BLR", type: "METRO_TRUNK", weight: 14.2, idx: "100.0", d1: "0.0%", d7: "+1.1%", d30: "+4.2%", fare: "₹3,500", status: "NORMAL", carriers: "6E, AI, I5, QP", flights: 38 },
    { code: "BOM-BLR", name: "Mumbai ↔ Bengaluru", airports: "BOM - BLR", type: "METRO_TRUNK", weight: 12.1, idx: "100.0", d1: "0.0%", d7: "+0.9%", d30: "+3.8%", fare: "₹2,800", status: "NORMAL", carriers: "6E, AI, QP", flights: 32 },
    { code: "DEL-CCU", name: "Delhi ↔ Kolkata", airports: "DEL - CCU", type: "METRO_TRUNK", weight: 10.5, idx: "100.0", d1: "0.0%", d7: "+1.4%", d30: "+4.9%", fare: "₹3,400", status: "NORMAL", carriers: "6E, AI, SG", flights: 26 },
    { code: "DEL-HYD", name: "Delhi ↔ Hyderabad", airports: "DEL - HYD", type: "METRO_TRUNK", weight: 9.8, idx: "100.0", d1: "0.0%", d7: "+1.0%", d30: "+3.9%", fare: "₹3,200", status: "NORMAL", carriers: "6E, AI, QP", flights: 24 },
    { code: "BOM-MAA", name: "Mumbai ↔ Chennai", airports: "BOM - MAA", type: "METRO_TRUNK", weight: 8.6, idx: "100.0", d1: "0.0%", d7: "+0.8%", d30: "+3.5%", fare: "₹3,100", status: "NORMAL", carriers: "6E, AI", flights: 20 },
    { code: "BLR-HYD", name: "Bengaluru ↔ Hyderabad", airports: "BLR - HYD", type: "METRO_TRUNK", weight: 7.9, idx: "100.0", d1: "0.0%", d7: "+0.7%", d30: "+3.2%", fare: "₹2,600", status: "NORMAL", carriers: "6E, AI, QP", flights: 18 },
    { code: "DEL-MAA", name: "Delhi ↔ Chennai", airports: "DEL - MAA", type: "METRO_TRUNK", weight: 7.5, idx: "100.0", d1: "0.0%", d7: "+1.1%", d30: "+4.0%", fare: "₹3,600", status: "NORMAL", carriers: "6E, AI", flights: 18 },
    { code: "DEL-IXS", name: "Delhi ↔ Silchar", airports: "DEL - IXS", type: "REGIONAL_THIN", weight: 5.8, idx: "100.0", d1: "0.0%", d7: "+2.1%", d30: "+6.8%", fare: "₹5,200", status: "VOLATILE", carriers: "6E, SG", flights: 8 },
    { code: "DEL-DHM", name: "Delhi ↔ Dharamshala", airports: "DEL - DHM", type: "REGIONAL_THIN", weight: 5.2, idx: "100.0", d1: "0.0%", d7: "+1.9%", d30: "+6.2%", fare: "₹4,800", status: "VOLATILE", carriers: "6E, SG", flights: 8 },
  ];

  const [corridors, setCorridors] = useState(defaultCorridors);

  useEffect(() => {
    async function loadCorridors() {
      const live = await fetchFromApi<CorridorItem[]>("/routes", []);
      if (live && live.length > 0) {
        setCorridors(
          live.map((c) => ({
            code: c.route_code,
            name: `${c.origin} ↔ ${c.destination}`,
            airports: `${c.origin_airport || c.origin} - ${c.destination_airport || c.destination}`,
            type: c.corridor_type,
            weight: parseFloat((c.dgca_weight * 100).toFixed(1)),
            idx: c.current_index ? c.current_index.toFixed(1) : "100.0",
            d1: `${c.daily_change_pct != null && c.daily_change_pct >= 0 ? "+" : ""}${c.daily_change_pct?.toFixed(1) || "0.0"}%`,
            d7: `${c.weekly_change_pct != null && c.weekly_change_pct >= 0 ? "+" : ""}${c.weekly_change_pct?.toFixed(1) || "1.2"}%`,
            d30: `${c.monthly_change_pct != null && c.monthly_change_pct >= 0 ? "+" : ""}${c.monthly_change_pct?.toFixed(1) || "4.5"}%`,
            fare: "₹3,000+",
            status: c.corridor_type === "REGIONAL_THIN" ? "VOLATILE" : "NORMAL",
            carriers: "6E, AI, SG, QP",
            flights: 24,
          }))
        );
      }
    }
    loadCorridors();
  }, []);

  const filtered = corridors
    .filter((c) => filterType === "ALL" || c.type === filterType)
    .filter((c) => 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="Domestic Aviation Corridor Basket & Heatmap"
        headline="Monitored basket of 10 primary domestic aviation corridors, weighted strictly by official DGCA domestic passenger traffic statistics."
        badge="DGCA BASKET 2026_V1"
        badgeVariant="solid"
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monitored Corridors"
          value="10 City Pairs"
          subtitle="8 Metro Trunk + 2 Regional Thin"
          icon={Plane}
          badge="DGCA Basket"
          badgeVariant="neutral"
        />
        <StatCard
          title="Passenger Volume Share"
          value="45.2M Annual"
          subtitle="Represents >68% total domestic traffic"
          icon={Layers}
          badge="High Representativeness"
          badgeVariant="neutral"
        />
        <StatCard
          title="Trunk Route Health"
          value="Competitive"
          subtitle="3-4 carriers per metro trunk route"
          icon={CheckCircle2}
          badge="Normal Volatility"
          badgeVariant="safe"
        />
        <StatCard
          title="Regional Sensitivity"
          value="Elevated Yields"
          subtitle="Silchar & Dharamshala lead volatility"
          icon={AlertTriangle}
          badge="Thin Route Premium"
          badgeVariant="warning"
        />
      </div>

      {/* Controls Bar: Search & Classification Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-mid-gray pointer-events-none" />
          <input
            type="text"
            placeholder="Search by city pair or code (e.g. DEL-BOM)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[18px] border border-hairline bg-canvas pl-9 pr-4 py-2 text-xs font-sans text-ink placeholder:text-mid-gray focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-[18px] border border-hairline bg-canvas p-1 self-start sm:self-auto">
          {(["ALL", "METRO_TRUNK", "REGIONAL_THIN"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-[18px] px-3.5 py-1.5 text-xs font-sans font-medium transition-all ${
                filterType === type
                  ? "bg-ink text-paper shadow-subtle"
                  : "text-mid-gray hover:text-ink"
              }`}
            >
              {type === "ALL" ? "All Corridors (10)" : type === "METRO_TRUNK" ? "Trunk Metro (8)" : "Thin Regional (2)"}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Spectrum Ribbon */}
      <div className="rounded-cards border border-hairline bg-paper p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-ink" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink font-sans">
              7-Day Relative Price Heatmap Spectrum
            </h3>
          </div>
          <span className="text-[11px] text-mid-gray font-sans">Sorted by DGCA passenger volume weight</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {corridors.map((c) => {
            const num = parseFloat(c.d7.replace(/[+%]/g, "")) || 0;
            const isSafe = num <= 1.0;
            const isWarning = num > 1.0 && num <= 2.0;
            const isCritical = num > 2.0;
            
            return (
              <Link
                key={c.code}
                href={`/corridors/${c.code}`}
                className={`group rounded-nested border p-2.5 text-center transition-all ${
                  isSafe
                    ? "border-emerald-200/70 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50/60"
                    : isWarning
                    ? "border-amber-200/70 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50/60"
                    : "border-red-200/70 bg-red-50/30 hover:border-red-400 hover:bg-red-50/60"
                }`}
              >
                <span className="font-mono text-xs font-bold text-ink block group-hover:underline">
                  {c.code}
                </span>
                <span className={`font-mono text-xs font-bold mt-1 block ${
                  isSafe ? "text-emerald-700" : isWarning ? "text-amber-800" : "text-critical"
                }`}>
                  {c.d7}
                </span>
                <span className="text-[10px] text-mid-gray font-sans block mt-0.5">
                  {c.weight}% wt
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Corridor Table */}
      <div className="rounded-cards border border-hairline bg-paper p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink font-sans">
            Aviation Corridor Contribution & Price Relative Matrix
          </h3>
          <span className="text-[11px] text-mid-gray font-sans">
            Showing {filtered.length} of {corridors.length} Corridors
          </span>
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
                <th className="pb-3.5 font-medium text-right">Fare Anatomy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline font-sans">
              {filtered.map((row) => {
                const num = parseFloat(row.d7.replace(/[+%]/g, "")) || 0;
                const paceVariant = num <= 1.0 ? "safe" : num <= 2.0 ? "warning" : "danger";

                return (
                  <tr key={row.code} className="hover:bg-canvas transition-colors">
                    <td className="py-4">
                      <div className="font-mono font-semibold text-ink text-sm">{row.code}</div>
                      <div className="text-ink-soft text-[11px] font-sans">{row.name}</div>
                    </td>
                    <td className="py-4">
                      <Badge variant={row.type === "METRO_TRUNK" ? "neutral" : "warning"} size="xs">
                        {row.type === "METRO_TRUNK" ? "Trunk Metro" : "Regional Thin"}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="font-sans font-semibold text-ink">{row.weight}%</div>
                      <div className="w-20 bg-canvas rounded-full h-1.5 mt-1 overflow-hidden border border-hairline">
                        <div
                          className="bg-ink h-full rounded-full"
                          style={{ width: `${row.weight * 4}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-4 font-mono font-bold text-ink text-sm">{row.fare}</td>
                    <td className="py-4 font-mono font-bold text-ink text-sm">{row.idx}</td>
                    <td className="py-4">
                      <Badge variant={paceVariant} size="xs">
                        {row.d7}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/corridors/${row.code}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline font-sans"
                      >
                        <span>Inspect Breakdown</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
