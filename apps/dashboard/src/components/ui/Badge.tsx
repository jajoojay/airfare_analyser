import React from "react";

export type BadgeVariant = 
  | "default" 
  | "solid" 
  | "soft" 
  | "outline" 
  | "cyan" 
  | "iris" 
  | "success" 
  | "safe" 
  | "warning" 
  | "intermediate" 
  | "danger" 
  | "critical" 
  | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "xs" | "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({ 
  children, 
  variant = "default", 
  size = "sm",
  dot = false,
  className = ""
}: BadgeProps) {
  // Monochromatic styles adhering to Design Rules:
  // Solid: #171717 bg, #fafafa text, 18px radius
  // Soft: #f5f5f5 bg, #171717 text, 1px #e5e5e5 border, 18px radius
  // Outline: transparent, #0a0a0a text, 1px #e5e5e5 border, 18px radius
  // Danger/Ember: #e7000b (only destructive accent)
  const variantStyles = {
    default: "bg-canvas text-ink-soft border-hairline",
    solid: "bg-ink text-paper border-transparent font-medium shadow-sm",
    soft: "bg-canvas text-ink-soft border-hairline font-medium",
    outline: "bg-transparent text-ink border-hairline font-medium",
    neutral: "bg-canvas text-mid-gray border-hairline",
    cyan: "bg-ink text-paper border-transparent font-medium",
    iris: "bg-canvas text-ink font-semibold border-hairline",
    
    // Status indicators: Safe (green), Intermediate (yellow), Critical (ember red)
    safe: "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium",
    warning: "bg-amber-50 text-amber-800 border-amber-200 font-medium",
    intermediate: "bg-amber-50 text-amber-800 border-amber-200 font-medium",
    danger: "bg-red-50 text-ember border-red-200 font-medium",
    critical: "bg-red-50 text-ember border-red-200 font-medium",
  };

  const dotColors = {
    default: "bg-mid-gray",
    solid: "bg-paper",
    soft: "bg-mid-gray",
    outline: "bg-ink",
    neutral: "bg-mid-gray",
    cyan: "bg-paper",
    iris: "bg-ink",
    safe: "bg-emerald-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    intermediate: "bg-amber-500",
    danger: "bg-ember",
    critical: "bg-ember",
  };

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[11px]",
    sm: "px-2.5 py-0.5 text-[12px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans rounded-[18px] border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.default}`} />}
      {children}
    </span>
  );
}


