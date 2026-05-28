import { createAccessGrant } from "@/server/access/createAccessGrant";
import { recordEvent } from "@/server/analytics/recordEvent";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import type { ProviderState } from "@/server/providers/types";

type CheckoutCustomerInput = {
  email?: string;
  name?: string | null;
};

function getCheckoutClient() {
  return hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient();
}

function normalizeCoupon(code?: string | null) {
  return code?.trim().toUpperCase() || null;
}

function computeDiscount(priceCents: number, coupon?: { discount_type: string; discount_value: number } | null) {
  if (!coupon) return 0;
  if (coupon.discount_type === "percent") {
    return Math.min(priceCents, Math.round((priceCents * coupon.discount_value) / 100));
  }
  return Math.min(priceCents, coupon.discount_value);
}

export async function createCheckoutIntent(input: {
  workspaceId: string;
  offerId: string;
  customer?: CheckoutCustomerInput;
  couponCode?: string | null;
  returnUrl?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await getCheckoutClient();
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("*")
    .eq("id", input.offerId)
    .eq("workspace_id", input.workspaceId)
    .eq("status", "published")
    .maybeSingle();

  if (offerError) return { ok: false as const, code: "offer_lookup_failed", message: offerError.message };
  if (!offer) return { ok: false as const, code: "offer_unavailable", message: "This offer is not available for checkout." };

  const code = normalizeCoupon(input.couponCode);
  const { data: coupon } = code
    ? await supabase
        .from("coupons")
        .select("*")
        .eq("workspace_id", input.workspaceId)
        .eq("code", code)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const discountCents = computeDiscount(Number(offer.price_cents ?? 0), coupon);
  const amountCents = Math.max(0, Number(offer.price_cents ?? 0) - discountCents);
  const { data: providerConnection } = await supabase
    .from("provider_connections")
    .select("status")
    .eq("workspace_id", input.workspaceId)
    .eq("provider", "stripe")
    .maybeSingle();
  const stripeStatus = (providerConnection?.status as ProviderState | undefined) ?? "not_configured";
  const providerReady = stripeStatus === "connected" || stripeStatus === "sandbox";

  let customerId: string | null = null;
  if (input.customer?.email) {
    const email = input.customer.email.trim().toLowerCase();
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("*")
      .eq("workspace_id", input.workspaceId)
      .eq("email", email)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: createdCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({ workspace_id: input.workspaceId, email, name: input.customer.name ?? null })
        .select("*")
        .single();
      if (customerError) return { ok: false as const, code: "customer_create_failed", message: customerError.message };
      customerId = createdCustomer.id;
    }
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      workspace_id: input.workspaceId,
      customer_id: customerId,
      offer_id: offer.id,
      status: amountCents === 0 ? "paid" : "pending",
      amount_cents: amountCents,
      currency: offer.currency,
      provider: providerReady ? "stripe" : null,
      metadata: {
        original_amount_cents: offer.price_cents,
        discount_cents: discountCents,
        coupon_code: code,
        source: "public_checkout",
      },
    })
    .select("*")
    .single();
  if (orderError) return { ok: false as const, code: "order_create_failed", message: orderError.message };

  await supabase.from("order_items").insert({
    workspace_id: input.workspaceId,
    order_id: order.id,
    offer_id: offer.id,
    title: offer.title,
    quantity: 1,
    unit_amount_cents: offer.price_cents,
    total_amount_cents: amountCents,
    metadata: { discount_cents: discountCents },
  });

  const { data: intent, error: intentError } = await supabase
    .from("checkout_intents")
    .insert({
      workspace_id: input.workspaceId,
      page_id: offer.page_id,
      offer_id: offer.id,
      customer_id: customerId,
      order_id: order.id,
      coupon_id: coupon?.id ?? null,
      status: amountCents === 0 ? "completed" : providerReady ? "ready" : "provider_required",
      provider: providerReady ? "stripe" : null,
      amount_cents: amountCents,
      discount_cents: discountCents,
      currency: offer.currency,
      return_url: input.returnUrl ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (intentError) return { ok: false as const, code: "checkout_intent_failed", message: intentError.message };

  if (amountCents === 0 && customerId) {
    await createAccessGrant({
      workspaceId: input.workspaceId,
      customerId,
      offerId: offer.id,
      grantType: offer.type,
      metadata: { order_id: order.id, checkout_intent_id: intent.id, reason: "free_checkout" },
    });
  }

  await recordEvent({
    workspaceId: input.workspaceId,
    pageId: offer.page_id,
    eventType: "checkout.started",
    metadata: { offerId: offer.id, orderId: order.id, checkoutIntentId: intent.id, providerReady },
  });

  await writeAuditLog({
    workspaceId: input.workspaceId,
    pageId: offer.page_id,
    actorType: "visitor",
    action: "checkout.intent_created",
    targetType: "checkout_intent",
    targetId: intent.id,
    after: intent,
  });

  return {
    ok: true as const,
    intent,
    order,
    offer,
    providerStatus: stripeStatus,
    checkout: providerReady
      ? { status: "ready", provider: "stripe", mode: stripeStatus }
      : { status: "provider_required", provider: "stripe", message: "Connect Stripe to accept paid checkout." },
  };
}
