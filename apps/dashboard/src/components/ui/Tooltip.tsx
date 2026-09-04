import React from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  label: string;
  tooltip: string;
  children?: React.ReactNode;
}

export function Tooltip({ label, tooltip, children }: TooltipProps) {
  return (
    <span className="relative inline-flex items-center gap-1 group cursor-help">
      {children ? (
        children
      ) : (
        <span className="border-b border-dotted border-mid-gray text-mid-gray hover:text-ink transition-colors">
          {label}
        </span>
      )}
      <HelpCircle className="h-3 w-3 text-mid-gray group-hover:text-ink transition-colors inline" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 rounded-nested border border-hairline bg-paper p-2.5 text-xs text-ink shadow-subtle z-50 font-sans font-normal leading-relaxed text-center">
        {tooltip}
      </span>
    </span>
  );
}

