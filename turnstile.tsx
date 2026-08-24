"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

/* ============================================================================
   LEARNING POINT — Cloudflare Turnstile Widget
   Renders the captcha, hands the solved token back via onToken().
   `ref.reset()` lets the parent refresh the token after each auth attempt
   (Turnstile tokens are single-use).
   ============================================================================ */

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileRef {
  reset: () => void;
}

export const Turnstile = forwardRef<TurnstileRef, { onToken: (token: string) => void }>(
  function Turnstile({ onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token: string) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(""),
        "expired-callback": () => onTokenRef.current(""),
      });
    }, []);

    useEffect(() => {
      if (window.turnstile) {
        renderWidget();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => renderWidget();
      document.head.appendChild(script);

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null;
        }
      };
    }, [renderWidget]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    // min-h prevents layout shift while the widget loads
    return <div ref={containerRef} className="min-h-[65px]" />;
  }
);

Turnstile.displayName = "Turnstile";
