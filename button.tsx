import { forwardRef, type ButtonHTMLAttributes } from "react";

/* ============================================================================
   LEARNING POINT — BUTTON COMPONENT (Emerald Edge)
   Variants: primary(gradient) | cta(amber) | secondary | outline | ghost | danger
   Sizes: sm | md | lg
   ============================================================================ */

type ButtonVariant = "primary" | "cta" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-base focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

const variantStyles: Record<ButtonVariant, string> = {
  // Signature emerald → blue gradient with glow on hover
  primary:
    "bg-gradient-primary text-white shadow-md hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0",
  // Amber CTA — high-energy action button
  cta:
    "bg-cta text-cta-text hover:bg-cta-hover shadow-md hover:shadow-glow-cta hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "bg-surface-2 text-content-primary border border-border hover:bg-surface-3 active:bg-surface-2",
  outline:
    "bg-transparent text-brand-400 border border-brand-600 hover:bg-brand-600/10 active:bg-brand-600/20",
  ghost:
    "bg-transparent text-content-secondary hover:text-content-primary hover:bg-surface-2",
  danger:
    "bg-error text-white hover:bg-error/90 active:bg-error shadow-md",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-7 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
