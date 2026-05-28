import Stripe from "stripe";
import type { PaymentProvider, CheckoutSessionResult, RefundResult } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export const stripeProvider: PaymentProvider = {
  async createCheckoutSession(input): Promise<CheckoutSessionResult> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return { ok: false, error: "Stripe secret key is not configured." };
    }

    const supabase = await createSupabaseServerClient();
    const { data: connection } = await supabase
      .from("provider_connections")
      .select("metadata")
      .eq("workspace_id", input.workspaceId)
      .eq("provider", "stripe")
      .maybeSingle();

    const stripeAccountId = connection?.metadata?.stripe_account_id as string | undefined;
    if (!stripeAccountId) {
      return { ok: false, error: "Stripe Express account is not connected for this workspace." };
    }

    try {
      const stripe = new Stripe(secretKey);
      
      // Look up offer info to populate nice line items if possible
      const { data: offer } = await supabase
        .from("offers")
        .select("title,description,cover_url")
        .eq("id", input.offerId)
        .maybeSingle();

      const session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: input.currency.toLowerCase(),
                product_data: {
                  name: offer?.title || "Product Purchase",
                  description: offer?.description || undefined,
                  images: offer?.cover_url ? [offer.cover_url] : undefined,
                },
                unit_amount: input.amountCents,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: input.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/portal/bookings`,
          cancel_url: input.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/`,
          metadata: {
            workspaceId: input.workspaceId,
            orderId: input.orderId,
            offerId: input.offerId,
            intentId: (input.metadata?.intentId as string) || "",
          },
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      return {
        ok: true,
        url: session.url || undefined,
        checkoutSessionId: session.id,
      };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to create Stripe checkout session." };
    }
  },

  async refundPayment(input): Promise<RefundResult> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return { ok: false, error: "Stripe secret key is not configured." };
    }

    const supabase = await createSupabaseServerClient();
    const { data: connection } = await supabase
      .from("provider_connections")
      .select("metadata")
      .eq("workspace_id", input.workspaceId)
      .eq("provider", "stripe")
      .maybeSingle();

    const stripeAccountId = connection?.metadata?.stripe_account_id as string | undefined;
    if (!stripeAccountId) {
      return { ok: false, error: "Stripe Express account is not connected for this workspace." };
    }

    const { data: order } = await supabase
      .from("orders")
      .select("provider_payment_id")
      .eq("id", input.orderId)
      .maybeSingle();

    const chargeId = order?.provider_payment_id;
    if (!chargeId) {
      return { ok: false, error: "Stripe charge ID (provider_payment_id) is not found for this order." };
    }

    try {
      const stripe = new Stripe(secretKey);
      const refund = await stripe.refunds.create(
        {
          charge: chargeId,
          amount: input.amountCents,
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      return {
        ok: true,
        refundId: refund.id,
      };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to issue Stripe refund." };
    }
  },
};
