import Razorpay from "razorpay";
import crypto from "node:crypto";

/* ============================================================================
   RAZORPAY (server-only)
   Creates orders and verifies payment signatures using the server-side key.
   Key secret NEVER reaches the browser.
   ============================================================================ */

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;

export function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expected === params.signature;
}
