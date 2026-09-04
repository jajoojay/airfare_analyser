import React from "react";
import { Badge } from "./Badge";

interface SectionHeaderProps {
  title: string;
  headline?: string;
  badge?: string;
  badgeVariant?: "default" | "solid" | "soft" | "outline" | "cyan" | "iris" | "success" | "warning" | "danger" | "neutral";
  action?: React.ReactNode;
}

export function SectionHeader({
  title,
  headline,
  badge,
  badgeVariant = "solid",
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-[30px] font-semibold tracking-[-0.75px] text-ink font-sans">
            {title}
          </h1>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        {headline && (
          <p className="mt-1.5 text-sm text-mid-gray font-sans leading-relaxed max-w-3xl">
            {headline}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

