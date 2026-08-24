import type { HTMLAttributes } from "react";

/* ============================================================================
   LEARNING POINT — CARD COMPONENT
   Surfaces for grouping content on dark background.
   Variants: default | elevated | interactive | accent
   ============================================================================ */

type CardVariant = "default" | "elevated" | "interactive" | "accent";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  accentColor?: string; // CSS color for accent variant
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-surface-1 border border-border-subtle",
  elevated: "bg-surface-2 border border-border shadow-lg",
  interactive:
    "bg-surface-1 border border-border-subtle hover:border-border hover:bg-surface-2 hover:shadow-md cursor-pointer transition-all duration-base",
  accent: "bg-surface-1 border border-border-subtle",
};

export function Card({
  variant = "default",
  accentColor,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl p-6 ${variantStyles[variant]} ${className}`}
      style={variant === "accent" && accentColor ? {
        borderTop: `3px solid ${accentColor}`,
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

/* ---- Card sub-components for consistent structure ---- */

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-xl font-bold text-content-primary leading-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-content-secondary mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center gap-3 mt-5 pt-4 border-t border-border-subtle ${className}`} {...props}>
      {children}
    </div>
  );
}
