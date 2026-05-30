import Stripe from "stripe";
import type { PaymentProvider, CheckoutSessionResult, RefundResult } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { getPlatformFeeAmount, getPlatformFeePercent, getStripe } from "./stripeClient";

export const stripeProvider: PaymentProvider = {
  async createCheckoutSession(input): Promise<CheckoutSessionResult> {
    const stripe = getStripe();
    if (!stripe) {
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
    const chargesEnabled = Boolean(connection?.metadata?.charges_enabled);
    if (!stripeAccountId) {
      return { ok: false, error: "Stripe account is not connected for this workspace." };
    }
    if (!chargesEnabled) {
      return { ok: false, error: "Stripe onboarding is not complete for this workspace." };
    }

    try {
      const { data: offer } = await supabase
        .from("offers")
        .select("title,description,cover_url,type,config")
        .eq("id", input.offerId)
        .maybeSingle();

      const isSubscription = offer?.type === "membership" || input.metadata?.mode === "subscription";
      const successUrl = input.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/portal/products?checkout=success`;
      const cancelUrl = input.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/`;
      const productData = {
        name: offer?.title || "KreatorOS purchase",
        description: offer?.description || undefined,
        images: offer?.cover_url ? [offer.cover_url] : undefined,
      };
      const metadata = {
        workspaceId: input.workspaceId,
        orderId: input.orderId,
        offerId: input.offerId,
        customerId: input.customerId || "",
        intentId: (input.metadata?.intentId as string) || "",
        bookingId: (input.metadata?.bookingId as string) || "",
      };
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: isSubscription ? "subscription" : "payment",
        customer_email: typeof input.metadata?.customerEmail === "string" ? input.metadata.customerEmail : undefined,
        line_items: [
          {
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: productData,
              unit_amount: input.amountCents,
              ...(isSubscription
                ? {
                    recurring: {
                      interval:
                        ((offer?.config as Record<string, unknown> | null)?.billing_interval as Stripe.PriceCreateParams.Recurring.Interval | undefined) ??
                        "month",
                    },
                  }
                : {}),
            },
            quantity: 1,
          },
        ],
        success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata,
        ...(isSubscription
          ? {
              subscription_data: {
                metadata,
                ...(getPlatformFeePercent() > 0 ? { application_fee_percent: getPlatformFeePercent() } : {}),
              },
            }
          : {
              payment_intent_data: {
                metadata,
                ...(getPlatformFeeAmount(input.amountCents) > 0
                  ? { application_fee_amount: getPlatformFeeAmount(input.amountCents) }
                  : {}),
              },
            }),
      };

      const session = await stripe.checkout.sessions.create(sessionParams, {
        stripeAccount: stripeAccountId,
      });

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
    const stripe = getStripe();
    if (!stripe) {
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
      return { ok: false, error: "Stripe account is not connected for this workspace." };
    }

    const { data: order } = await supabase
      .from("orders")
      .select("provider_payment_id, provider_payment_intent_id")
      .eq("id", input.orderId)
      .maybeSingle();

    const paymentIntentId = order?.provider_payment_intent_id || order?.provider_payment_id;
    if (!paymentIntentId) {
      return { ok: false, error: "Stripe payment intent ID is not found for this order." };
    }

    try {
      const refund = await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          amount: input.amountCents,
          metadata: { workspaceId: input.workspaceId, orderId: input.orderId },
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
