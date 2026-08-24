import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

/* ============================================================================
   LEARNING POINT — FORM INPUT COMPONENTS
   Input, Textarea, Select with dark theme styling.
   ============================================================================ */

const fieldBase =
  "w-full bg-surface-1 border border-border text-content-primary placeholder-content-muted rounded-lg px-4 transition-all duration-fast focus:outline-none focus:border-brand-500 focus:shadow-glow disabled:opacity-50";

/* ---- Input ---- */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-content-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${fieldBase} h-11 ${leftIcon ? "pl-10" : ""} ${
              error ? "border-error focus:border-error" : ""
            } ${className}`}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-content-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ---- Textarea ---- */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-content-secondary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`${fieldBase} py-3 min-h-[100px] resize-y ${
            error ? "border-error" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
