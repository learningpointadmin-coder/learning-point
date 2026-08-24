import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import {
  getProfileByAuthId,
  grantEntitlement,
  recordPayment,
} from "@/lib/supabase-server";

/* ============================================================================
   POST /api/payment/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature,
           testSeriesId, profileAuthId, amountCents }
   Verifies the signature (HMAC, server-side), then logs the payment and
   grants lifetime entitlement to the test series.
   ============================================================================ */

export async function POST(req: Request) {
  let b: any;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, testSeriesId, profileAuthId, amountCents } = b || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment parameters." }, { status: 400 });
  }

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  const profile = await getProfileByAuthId(profileAuthId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found — please log in." }, { status: 400 });
  }

  try {
    await recordPayment({
      profileId: profile.id,
      itemType: "test_series",
      itemId: testSeriesId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amountCents: Number(amountCents) || 0,
    });
    await grantEntitlement(profile.id, "test_series", testSeriesId);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Payment verified but could not record: " + (e?.message || "db error") },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
