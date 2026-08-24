import type { HTMLAttributes } from "react";

/* ============================================================================
   LEARNING POINT — BADGE COMPONENT
   Small status/category labels.
   Variants: brand | category-* | success | warning | error | info | neutral
   ============================================================================ */

type BadgeVariant =
  | "brand"
  | "agriculture"
  | "quant"
  | "reasoning"
  | "gk"
  | "computer"
  | "language"
  | "science"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  brand: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  agriculture: "bg-[rgba(34,197,94,0.15)] text-accent-agriculture border-[rgba(34,197,94,0.3)]",
  quant: "bg-[rgba(59,130,246,0.15)] text-accent-quant border-[rgba(59,130,246,0.3)]",
  reasoning: "bg-[rgba(168,85,247,0.15)] text-accent-reasoning border-[rgba(168,85,247,0.3)]",
  gk: "bg-[rgba(245,158,11,0.15)] text-accent-gk border-[rgba(245,158,11,0.3)]",
  computer: "bg-[rgba(6,182,212,0.15)] text-accent-computer border-[rgba(6,182,212,0.3)]",
  language: "bg-[rgba(244,63,94,0.15)] text-accent-language border-[rgba(244,63,94,0.3)]",
  science: "bg-[rgba(20,184,166,0.15)] text-accent-science border-[rgba(20,184,166,0.3)]",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  error: "bg-error/15 text-error border-error/30",
  info: "bg-info/15 text-info border-info/30",
  neutral: "bg-surface-3 text-content-secondary border-border",
};

export function Badge({
  variant = "neutral",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${variantStyles[variant]} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
