import type { Config } from "tailwindcss";

/**
 * ============================================================================
 * LEARNING POINT — TAILWIND CONFIG · THEME: "EMERALD EDGE"
 * ============================================================================
 * Emerald (brand) + Sky Blue (secondary) + Amber (CTA).
 * All colors reference CSS custom properties from globals.css.
 * ============================================================================
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: {
          1: "var(--bg-surface-1)",
          2: "var(--bg-surface-2)",
          3: "var(--bg-surface-3)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
        },
        secondary: {
          400: "var(--secondary-400)",
          500: "var(--secondary-500)",
          600: "var(--secondary-600)",
        },
        cta: {
          DEFAULT: "var(--cta)",
          hover: "var(--cta-hover)",
          text: "var(--cta-text)",
        },
        accent: {
          agriculture: "var(--accent-agriculture)",
          quant: "var(--accent-quant)",
          reasoning: "var(--accent-reasoning)",
          gk: "var(--accent-gk)",
          computer: "var(--accent-computer)",
          language: "var(--accent-language)",
          science: "var(--accent-science)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
      },
      lineHeight: {
        tight: "var(--leading-tight)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
        "glow-cta": "var(--shadow-glow-cta)",
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-cta": "var(--gradient-cta)",
      },
      transitionDuration: { fast: "150ms", base: "250ms", slow: "400ms" },
      maxWidth: { container: "var(--container-max)" },
      height: { header: "var(--header-height)", "mobile-nav": "var(--mobile-nav-height)" },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 400ms cubic-bezier(0.4, 0, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
