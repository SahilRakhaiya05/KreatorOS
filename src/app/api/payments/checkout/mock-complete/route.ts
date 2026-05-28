import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { createAccessGrant } from "@/server/access/createAccessGrant";
import { recordEvent } from "@/server/analytics/recordEvent";
import { emitEvent } from "@/server/events/emitEvent";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");
  const intentId = url.searchParams.get("intent_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) {
    return NextResponse.json({ error: "Mock complete is only available in development mode." }, { status: 403 });
  }

  const supabase = hasSupabaseServiceConfig() ? createSupabaseServiceClient() : await createSupabaseServerClient();

  // 1. Fetch order
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ ok: true, message: "Order is already paid" });
  }

  // 2. Mark order as paid
  await supabase
    .from("orders")
    .update({
      status: "paid",
      provider_payment_id: `mock_charge_${Date.now()}`,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // 3. Mark checkout intent as completed
  if (intentId) {
    await supabase
      .from("checkout_intents")
      .update({ status: "completed" })
      .eq("id", intentId);
  }

  // 4. Create access grant if customer exists
  if (order.customer_id) {
    const { data: offer } = await supabase
      .from("offers")
      .select("type")
      .eq("id", order.offer_id)
      .maybeSingle();

    await createAccessGrant({
      workspaceId: order.workspace_id,
      customerId: order.customer_id,
      offerId: order.offer_id,
      grantType: offer?.type || "offer",
      metadata: {
        order_id: orderId,
        reason: "mock_payment_completed",
      },
    });

    // Automatically confirm the booking in mock mode if checkout_intent specifies a bookingId
    if (intentId) {
      const { data: intent } = await supabase
        .from("checkout_intents")
        .select("metadata")
        .eq("id", intentId)
        .maybeSingle();

      const bookingId = intent?.metadata?.bookingId as string | undefined;
      if (bookingId) {
        const { bookingService } = await import("@/server/bookings/bookingService");
        await bookingService.confirmBooking(bookingId, orderId);
      }
    }
  }

  // 5. Emit events & record analytics
  await recordEvent({
    workspaceId: order.workspace_id,
    eventType: "payment.succeeded",
    metadata: { orderId, offerId: order.offer_id, isMock: true },
  });

  await emitEvent({
    type: "payment.succeeded",
    workspaceId: order.workspace_id,
    actorType: "customer",
    payload: { orderId, offerId: order.offer_id, isMock: true },
    idempotencyKey: `mock_paid:${orderId}`,
  });

  await writeAuditLog({
    workspaceId: order.workspace_id,
    actorType: "customer",
    action: "payment.succeeded",
    targetType: "order",
    targetId: orderId,
    after: { isMock: true },
  });

  return NextResponse.json({
    ok: true,
    message: "Simulated checkout completed successfully. Access has been unlocked, and events have been emitted.",
  });
}
