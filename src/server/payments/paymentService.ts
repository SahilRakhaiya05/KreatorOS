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

          let expiresAt: string | undefined;

          // If session is a subscription, get subscription information to populate access grant bounds
          if (session.mode === "subscription" && session.subscription) {
            try {
              const subObj = await stripe.subscriptions.retrieve(session.subscription as string);
              expiresAt = new Date((subObj as any).current_period_end * 1000).toISOString();
            } catch {
              // Ignore failure
            }
          }

          await createAccessGrant({
            workspaceId,
            customerId: order.customer_id,
            offerId,
            grantType: offer?.type || "offer",
            metadata: {
              order_id: orderId,
              stripe_session_id: session.id,
              stripe_subscription_id: session.subscription as string || undefined,
              reason: "stripe_payment_completed",
            },
          });

          // If expires_at was resolved, update the created access grant with expiration boundary
          if (expiresAt) {
            const { data: createdGrant } = await supabase
              .from("access_grants")
              .select("id")
              .eq("customer_id", order.customer_id)
              .eq("offer_id", offerId)
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (createdGrant) {
              await supabase
                .from("access_grants")
                .update({ expires_at: expiresAt })
                .eq("id", createdGrant.id);
            }
          }

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
      } else if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as any;
        if (invoice && invoice.subscription) {
          const supabase = await getServiceClient();
          const { data: grants } = await supabase
            .from("access_grants")
            .select("*")
            .eq("status", "active");

          const matchingGrant = (grants ?? []).find(
            (g) => (g.metadata as any)?.stripe_subscription_id === invoice.subscription
          );

          if (matchingGrant) {
            try {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              const expiresAt = new Date((subscription as any).current_period_end * 1000).toISOString();

              const updatedMetadata = {
                ...((matchingGrant.metadata as Record<string, unknown>) || {}),
                last_invoice_paid_at: new Date().toISOString(),
                stripe_invoice_id: invoice.id,
              };

              await supabase
                .from("access_grants")
                .update({
                  expires_at: expiresAt,
                  metadata: updatedMetadata,
                })
                .eq("id", matchingGrant.id);

              await emitEvent({
                type: "membership.renewed",
                workspaceId: matchingGrant.workspace_id,
                actorType: "system",
                payload: { subscriptionId: invoice.subscription, accessGrantId: matchingGrant.id },
                idempotencyKey: `sub_renewed:${invoice.id}`,
              });

              await writeAuditLog({
                workspaceId: matchingGrant.workspace_id,
                actorType: "system",
                action: "membership.renewed",
                targetType: "access_grant",
                targetId: matchingGrant.id,
                after: { expiresAt, invoiceId: invoice.id },
              });
            } catch {
              // Fail silently in development
            }
          }
        }
      } else if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
        const subscription = event.data.object as any;
        const status = subscription?.status as string;
        const shouldRevoke = event.type === "customer.subscription.deleted" || 
          status === "unpaid" || 
          status === "canceled";

        if (shouldRevoke && subscription && subscription.id) {
          const supabase = await getServiceClient();
          const { data: grants } = await supabase
            .from("access_grants")
            .select("*")
            .eq("status", "active");

          const matchingGrant = (grants ?? []).find(
            (g) => (g.metadata as any)?.stripe_subscription_id === subscription.id
          );

          if (matchingGrant) {
            await supabase
              .from("access_grants")
              .update({
                status: "expired",
                metadata: {
                  ...((matchingGrant.metadata as Record<string, unknown>) || {}),
                  revoked_at: new Date().toISOString(),
                  stripe_subscription_status: status,
                },
              })
              .eq("id", matchingGrant.id);

            await emitEvent({
              type: "membership.revoked",
              workspaceId: matchingGrant.workspace_id,
              actorType: "system",
              payload: { subscriptionId: subscription.id, accessGrantId: matchingGrant.id, status },
              idempotencyKey: `sub_revoked:${subscription.id}:${new Date().getTime()}`,
            });

            await writeAuditLog({
              workspaceId: matchingGrant.workspace_id,
              actorType: "system",
              action: "membership.revoked",
              targetType: "access_grant",
              targetId: matchingGrant.id,
              after: { status },
            });
          }
        }
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to process Stripe webhook." };
    }
  },
};
