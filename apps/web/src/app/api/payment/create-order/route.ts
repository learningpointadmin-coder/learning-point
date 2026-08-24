import { NextResponse } from "next/server";
import { getRazorpay, RAZORPAY_KEY_ID } from "@/lib/razorpay";
import { getTestSeriesForExam } from "@/lib/supabase-server";

/* ============================================================================
   POST /api/payment/create-order
   Body: { examId }
   Resolves the exam's test series + price, creates a Razorpay order.
   Returns the order details (Key ID is public-safe for the checkout widget).
   ============================================================================ */

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ts = await getTestSeriesForExam(body?.examId);
  if (!ts) {
    return NextResponse.json({ error: "No test series found for this exam." }, { status: 404 });
  }

  const rzp = getRazorpay();
  try {
    const order = await rzp.orders.create({
      amount: Number(ts.price_cents),
      currency: "INR",
      receipt: `lp_${Date.now()}`,
      notes: { test_series_id: ts.id, name: ts.name },
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      name: ts.name,
      testSeriesId: ts.id,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.error?.description || e?.message || "Order creation failed." },
      { status: 500 }
    );
  }
}
