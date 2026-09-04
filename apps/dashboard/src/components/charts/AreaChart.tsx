"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AreaChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  height?: number;
  color?: "iris" | "cyan" | "emerald" | "amber";
  yDomain?: [number | "auto", number | "auto"];
  valuePrefix?: string;
  valueSuffix?: string;
  yTickFormatter?: (val: any) => string;
}

export function AreaChart({
  data,
  xKey,
  yKey,
  height = 240,
  color = "iris",
  yDomain = ["auto", "auto"],
  valuePrefix = "",
  valueSuffix = "",
  yTickFormatter,
}: AreaChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-nested bg-canvas border border-hairline animate-pulse flex items-center justify-center text-xs text-mid-gray font-sans"
      >
        Loading visualization...
      </div>
    );
  }

  const strokeMap: Record<string, string> = {
    iris: "#0a0a0a",
    cyan: "#0a0a0a",
    emerald: "#059669",
    amber: "#d97706",
  };

  const gradientMap: Record<string, [string, string]> = {
    iris: ["rgba(10, 10, 10, 0.16)", "rgba(10, 10, 10, 0.01)"],
    cyan: ["rgba(10, 10, 10, 0.16)", "rgba(10, 10, 10, 0.01)"],
    emerald: ["rgba(16, 185, 129, 0.20)", "rgba(16, 185, 129, 0.01)"],
    amber: ["rgba(245, 158, 11, 0.20)", "rgba(245, 158, 11, 0.01)"],
  };

  const stroke = strokeMap[color] || "#0a0a0a";
  const gradient = gradientMap[color] || gradientMap.iris;
  const gradientId = `area-gradient-${color}-${yKey}`;

  return (
    <div style={{ height, width: "100%" }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradient[0]} />
              <stop offset="95%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e5e5"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            stroke="#737373"
            fontSize={11}
            tickMargin={8}
            fontFamily="var(--font-sans)"
          />
          <YAxis
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            stroke="#737373"
            fontSize={11}
            tickMargin={8}
            fontFamily="var(--font-sans)"
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value;
                return (
                  <div className="rounded-[14px] border border-hairline bg-paper p-3 shadow-md font-sans text-xs">
                    <div className="text-mid-gray text-[11px] mb-1 font-medium">{label}</div>
                    <div className="text-ink font-semibold text-sm flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stroke }} />
                      <span>{valuePrefix}{val}{valueSuffix}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={stroke}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 4.5,
              stroke: "#ffffff",
              strokeWidth: 2,
              fill: stroke,
            }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

