import { getProviderStatus } from "@/server/providers/status";
import { stripeProvider } from "./stripeProvider";
import { mockPaymentProvider } from "./mockPaymentProvider";
import type { CheckoutSessionResult, RefundResult } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { createAccessGrant } from "@/server/access/createAccessGrant";
import { recordEvent } from "@/server/analytics/recordEvent";
import { emitEvent } from "@/server/events/emitEvent";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import Stripe from "stripe";

function getServiceClient() {
  return hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient();
}

export const paymentService = {
  async createCheckoutSession(input: {
    workspaceId: string;
    offerId: string;
    orderId: string;
    customerId?: string | null;
    amountCents: number;
    currency: string;
    returnUrl?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<CheckoutSessionResult> {
    const status = await getProviderStatus(input.workspaceId, "stripe");
    const isDev = process.env.NODE_ENV !== "production";

    // If Stripe is configured, use it. Otherwise, fall back to mock in dev/sandbox.
    if (status === "connected" || status === "sandbox") {
      return stripeProvider.createCheckoutSession(input);
    } else if (status === "mock_mode" || isDev) {
      return mockPaymentProvider.createCheckoutSession(input);
    }

    return {
      ok: false,
      error: "Payments are not configured for this workspace. Please connect Stripe.",
    };
  },

  async refundPayment(input: {
    workspaceId: string;
    orderId: string;
    amountCents?: number;
  }): Promise<RefundResult> {
    const status = await getProviderStatus(input.workspaceId, "stripe");
    const isDev = process.env.NODE_ENV !== "production";

    if (status === "connected" || status === "sandbox") {
      return stripeProvider.refundPayment(input);
    } else if (status === "mock_mode" || isDev) {
      return mockPaymentProvider.refundPayment(input);
    }

    return {
      ok: false,
      error: "Payments are not configured. Cannot refund.",
    };
  },

  async handleWebhook(rawBody: string, signature: string): Promise<{ ok: boolean; error?: string }> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey) {
      return { ok: false, error: "Stripe key is missing." };
    }

    try {
      const stripe = new Stripe(secretKey);
      let event: Stripe.Event;

      if (webhookSecret && signature) {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } else {
        // Safe development fallback if signature verification is not possible
        if (process.env.NODE_ENV === "production") {
          return { ok: false, error: "Signature verification required in production." };
        }
        event = JSON.parse(rawBody) as Stripe.Event;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        
        const workspaceId = metadata.workspaceId;
        const orderId = metadata.orderId;
        const offerId = metadata.offerId;
        const intentId = metadata.intentId;

        if (!workspaceId || !orderId || !offerId) {
          return { ok: false, error: "Missing required metadata on Stripe checkout session." };
        }

        const supabase = await getServiceClient();

        // 1. Fetch the existing order
        const { data: order } = await supabase
          .from("orders")
          .select("customer_id, status")
          .eq("id", orderId)
          .maybeSingle();

        if (!order) {
          return { ok: false, error: `Order ${orderId} not found.` };
        }

        if (order.status === "paid") {
          return { ok: true }; // Already processed
        }

        // 2. Mark order as paid
        await supabase
          .from("orders")
          .update({
            status: "paid",
            provider_payment_id: session.payment_intent as string || session.id,
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
            .eq("id", offerId)
            .maybeSingle();

          await createAccessGrant({
            workspaceId,
            customerId: order.customer_id,
            offerId,
            grantType: offer?.type || "offer",
            metadata: {
              order_id: orderId,
              stripe_session_id: session.id,
              reason: "stripe_payment_completed",
            },
          });

          // Confirm the booking automatically if bookingId is in metadata
          const bookingId = metadata.bookingId as string | undefined;
          if (bookingId) {
            const { bookingService } = await import("@/server/bookings/bookingService");
            await bookingService.confirmBooking(bookingId, orderId);
          }
        }

        // 5. Emit events & record analytics
        await recordEvent({
          workspaceId,
          eventType: "payment.succeeded",
          metadata: { orderId, offerId, stripeSessionId: session.id },
        });

        await emitEvent({
          type: "payment.succeeded",
          workspaceId,
          actorType: "customer",
          payload: { orderId, offerId, stripeSessionId: session.id },
          idempotencyKey: `stripe_paid:${session.id}`,
        });

        await writeAuditLog({
          workspaceId,
          actorType: "customer",
          action: "payment.succeeded",
          targetType: "order",
          targetId: orderId,
          after: { stripeSessionId: session.id },
        });
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to process Stripe webhook." };
    }
  },
};
