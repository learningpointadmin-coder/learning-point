"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/* ============================================================================
   PAYMENT BUTTON (client)
   create-order → Razorpay checkout → verify (server) → entitlement granted.
   Requires a logged-in user (needed to attach the entitlement).
   ============================================================================ */

function loadCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(s);
  });
}

export function PaymentButton({
  examId,
  amountLabel,
  label = "Buy Bundle",
  size = "lg",
  fullWidth = true,
}: {
  examId: string;
  amountLabel?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setError(null);
    setStatus("loading");
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setError("Please log in first to purchase.");
        setStatus("idle");
        return;
      }

      // 1. create order
      const r = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });
      const o = await r.json();
      if (!r.ok) throw new Error(o.error || "Could not create order.");

      // 2. open Razorpay checkout
      await loadCheckout();
      const rzp = new (window as any).Razorpay({
        key_id: o.keyId,
        amount: o.amount,
        currency: o.currency,
        name: "Learning Point",
        description: o.name,
        order_id: o.orderId,
        theme: { color: "#10b981" },
        handler: async (resp: any) => {
          // 3. verify signature server-side
          try {
            const vr = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                testSeriesId: o.testSeriesId,
                profileAuthId: user.id,
                amountCents: o.amount,
              }),
            });
            const vd = await vr.json();
            if (vd.ok) setStatus("done");
            else setError(vd.error || "Verification failed.");
          } catch (e: any) {
            setError(e.message);
          } finally {
            setStatus((s) => (s === "loading" ? "idle" : s));
          }
        },
        modal: { ondismiss: () => setStatus("idle") },
      });
      rzp.on("payment.failed", (resp: any) => {
        setError(resp?.error?.description || "Payment failed.");
        setStatus("idle");
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-brand-500/10 border border-brand-600 rounded-lg p-4 text-center">
        <div className="text-2xl mb-1">✅</div>
        <div className="font-bold text-brand-300">Payment successful!</div>
        <div className="text-xs text-content-secondary mt-1">Bundle unlocked — enjoy full access.</div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="primary"
        size={size}
        fullWidth={fullWidth}
        onClick={handlePay}
        isLoading={status === "loading"}
      >
        {label} {amountLabel && <span className="opacity-80">· {amountLabel}</span>}
      </Button>
      {error && <p className="text-xs text-error mt-2 text-center">{error}</p>}
    </div>
  );
}
