import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Badge, BadgeVariant } from "./Badge";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number | null;
  changeLabel?: string;
  changeInverted?: boolean; // If true, positive is good (e.g. coverage rate)
  subtitle?: string;
  highlight?: boolean;
  accent?: "iris" | "cyan" | "emerald" | "amber" | "default";
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
}

export function StatCard({
  title,
  value,
  unit,
  change,
  changeLabel,
  changeInverted = false,
  subtitle,
  highlight = false,
  accent = "default",
  icon: Icon,
  badge,
  badgeVariant = "neutral",
  size = "md",
}: StatCardProps) {
  const isPositive = change !== undefined && change !== null && change > 0;
  const isNegative = change !== undefined && change !== null && change < 0;

  // Status-aware badge: Green for safe/discounts, Yellow for intermediate, Red for high surge/distress
  const getBadgeClass = () => {
    if (change === undefined || change === null) return "";
    if (change === 0) return "bg-canvas text-ink-soft border-hairline";

    if (changeInverted) {
      // Inverted: positive is safe (e.g. 98% coverage), negative is alert
      return isPositive
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-red-50 text-ember border-red-200";
    }

    // Default: negative is safe (price drop/savings)
    if (isNegative) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }

    // Positive price change:
    // Mild/Intermediate (+0.1% to +4.9%): Yellow / Amber
    // High surge (>= +5.0%): Red / Ember
    if (change >= 5.0) {
      return "bg-red-50 text-ember border-red-200";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  const getArrowColor = () => {
    if (change === undefined || change === null) return "text-mid-gray";
    if (changeInverted) {
      return isPositive ? "text-emerald-700" : "text-ember";
    }
    if (isNegative) return "text-emerald-700";
    if (change >= 5.0) return "text-ember";
    return "text-amber-700";
  };

  return (
    <div
      className={`relative rounded-cards border border-hairline bg-paper p-5 transition-all duration-150 ${
        highlight 
          ? "ring-1 ring-ink shadow-elevated" 
          : "shadow-subtle hover:border-[#d4d4d4]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-canvas border border-hairline text-ink">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="text-[12px] font-medium tracking-[0.6px] text-mid-gray uppercase font-sans">
            {title}
          </span>
        </div>

        {badge && (
          <Badge variant={badgeVariant} size="xs">
            {badge}
          </Badge>
        )}

        {change !== undefined && change !== null && (
          <div
            className={`flex items-center gap-0.5 rounded-[18px] px-2.5 py-0.5 text-[11px] font-mono font-medium border ${getBadgeClass()}`}
          >
            {isPositive ? (
              <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 ${getArrowColor()}`} />
            ) : isNegative ? (
              <ArrowDownRight className={`h-3.5 w-3.5 shrink-0 ${getArrowColor()}`} />
            ) : (
              <Minus className="h-3.5 w-3.5 shrink-0 text-mid-gray" />
            )}
            <span>
              {change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-semibold text-ink font-sans ${
              size === "lg" 
                ? "text-4xl sm:text-5xl tracking-[-2.4px] leading-none" 
                : size === "sm" 
                ? "text-xl tracking-[-0.6px]" 
                : "text-3xl tracking-[-0.9px]"
            }`}
          >
            {value}
          </span>
          {unit && <span className="text-sm font-normal text-mid-gray font-sans">{unit}</span>}
        </div>

        {subtitle && (
          <p className="mt-1.5 text-xs text-ink-soft leading-snug font-sans">
            {subtitle}
          </p>
        )}

        {changeLabel && (
          <p className="mt-1 text-[11px] text-mid-gray font-sans">
            {changeLabel}
          </p>
        )}
      </div>
    </div>
  );
}


