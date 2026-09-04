"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Plane, 
  Activity, 
  Route, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  Menu, 
  X
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: "National Pulse",
      href: "/",
      icon: Activity,
      isActive: pathname === "/",
      desc: "Macroeconomic APIx index & headline inflation"
    },
    {
      label: "Corridor Intelligence",
      href: "/corridors",
      icon: Route,
      isActive: pathname.startsWith("/corridors") || pathname.startsWith("/routes"),
      desc: "10 DGCA passenger pairs, heatmaps & fare anatomy"
    },
    {
      label: "Market Dynamics",
      href: "/market-dynamics",
      icon: TrendingUp,
      isActive: pathname.startsWith("/market-dynamics") || 
                pathname === "/carrier-inflation" || 
                pathname === "/fluctuations" || 
                pathname === "/lead-time" || 
                pathname === "/fuel-context",
      desc: "Carrier power, lead-time curves, volatility & fuel overlay"
    },
    {
      label: "Governance & Audit",
      href: "/governance",
      icon: ShieldCheck,
      isActive: pathname.startsWith("/governance") || 
                pathname === "/validation" || 
                pathname === "/quality" || 
                pathname === "/sources" || 
                pathname === "/methodology",
      desc: "MoSPI CPI benchmark, data pipeline & mathematical specs"
    },
  ];

  const corridorsList = [
    { code: "DEL-BOM", name: "Delhi ↔ Mumbai" },
    { code: "DEL-BLR", name: "Delhi ↔ Bengaluru" },
    { code: "BOM-BLR", name: "Mumbai ↔ Bengaluru" },
    { code: "DEL-CCU", name: "Delhi ↔ Kolkata" },
    { code: "DEL-HYD", name: "Delhi ↔ Hyderabad" },
    { code: "BOM-MAA", name: "Mumbai ↔ Chennai" },
    { code: "BLR-HYD", name: "Bengaluru ↔ Hyderabad" },
    { code: "DEL-MAA", name: "Delhi ↔ Chennai" },
    { code: "DEL-IXS", name: "Delhi ↔ Silchar (Regional)" },
    { code: "DEL-DHM", name: "Delhi ↔ Dharamshala (Regional)" },
  ];

  const handleCorridorJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      router.push(`/corridors/${val}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Brand & Institutional Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-canvas border border-hairline text-ink group-hover:border-mid-gray transition-colors">
            <Plane className="h-4.5 w-4.5 text-ink group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-ink font-sans">
                AIRFARE OBSERVATORY
              </span>
              <span className="rounded-[18px] bg-canvas px-2 py-0.5 text-[10px] font-medium text-mid-gray border border-hairline font-sans">
                MoSPI / NSO · APIx
              </span>
            </div>
            <p className="text-[11px] text-mid-gray font-sans tracking-tight">National Price Intelligence · India</p>
          </div>
        </Link>

        {/* Desktop 4-Pillar Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[18px] text-xs font-medium transition-all ${
                  item.isActive
                    ? "bg-ink text-paper font-medium shadow-sm"
                    : "text-mid-gray hover:text-ink hover:bg-canvas"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${item.isActive ? "text-paper" : "text-mid-gray"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Quick Route Selector & Live Status Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-hairline">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3 w-3 text-mid-gray pointer-events-none" />
              <select
                onChange={handleCorridorJump}
                defaultValue=""
                aria-label="Jump to Corridor"
                className="rounded-[18px] border border-hairline bg-canvas pl-7 pr-3 py-1 text-xs font-sans text-ink hover:border-mid-gray transition-colors focus:outline-none focus:border-ink cursor-pointer"
              >
                <option value="" disabled>
                  Jump to Corridor...
                </option>
                {corridorsList.map((c) => (
                  <option key={c.code} value={c.code} className="bg-paper text-ink">
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 rounded-[18px] border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-sans font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <select
            onChange={handleCorridorJump}
            defaultValue=""
            aria-label="Corridor Quick Selector"
            className="rounded-[18px] border border-hairline bg-canvas px-2.5 py-1 text-[11px] font-sans text-ink"
          >
            <option value="" disabled>Corridor...</option>
            {corridorsList.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-[10px] border border-hairline bg-canvas p-1.5 text-mid-gray hover:text-ink"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-hairline bg-paper px-4 py-4 md:hidden space-y-2 animate-in fade-in duration-200">
          <div className="text-[10px] uppercase tracking-wider text-mid-gray font-sans font-medium mb-1">
            Enterprise Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-start gap-2.5 p-2.5 rounded-nested transition-all ${
                  item.isActive
                    ? "bg-canvas text-ink font-semibold border border-hairline"
                    : "text-mid-gray hover:text-ink hover:bg-canvas"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${item.isActive ? "text-ink" : "text-mid-gray"}`} />
                <div>
                  <div className="text-xs font-sans text-ink">{item.label}</div>
                  <div className="text-[11px] text-mid-gray leading-tight font-sans mt-0.5">{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
