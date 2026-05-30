import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { checkoutSchema } from "@/server/api/schemas";
import { createCheckoutIntent } from "@/server/checkout/createCheckoutIntent";
import { paymentService } from "@/server/payments/paymentService";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, checkoutSchema);
  if (isApiResponse(body)) return body;

  if (!body.workspaceId) {
    return apiError("missing_workspace", "workspaceId is required to start checkout.", 400);
  }

  if (!body.offerId) {
    return apiError("missing_offer", "offerId is required to start checkout.", 400);
  }

  const result = await createCheckoutIntent({
    workspaceId: body.workspaceId,
    offerId: body.offerId,
    customer: body.customer,
    couponCode: body.couponCode,
    returnUrl: body.returnUrl,
    metadata: { productId: body.productId, bookingId: body.bookingId },
  });

  if (!result.ok) return apiError(result.code, result.message, 400);
  if (result.checkout.status === "provider_required" && result.order.amount_cents > 0) {
    const errorMessage = ("message" in result.checkout && result.checkout.message) || "Connect Stripe to accept paid checkout.";
    return apiError("provider_not_configured", errorMessage, 409, {
      checkoutIntent: result.intent,
      order: result.order,
      offer: result.offer,
    });
  }

  if (result.order.amount_cents > 0 && result.checkout.status === "ready") {
    const checkoutSession = await paymentService.createCheckoutSession({
      workspaceId: body.workspaceId,
      offerId: body.offerId,
      orderId: result.order.id,
      customerId: result.order.customer_id,
      amountCents: result.order.amount_cents,
      currency: result.order.currency,
      returnUrl: body.returnUrl,
      metadata: {
        ...((result.intent.metadata as Record<string, unknown> | null) ?? {}),
        intentId: result.intent.id,
        customerEmail: body.customer?.email,
      },
    });

    if (!checkoutSession.ok || !checkoutSession.url) {
      return apiError("checkout_session_failed", checkoutSession.error || "Stripe checkout could not be started.", 502, {
        checkoutIntent: result.intent,
        order: result.order,
      });
    }

    const supabase = await createSupabaseServerClient();
    await Promise.all([
      supabase
        .from("orders")
        .update({
          provider: "stripe",
          provider_checkout_id: checkoutSession.checkoutSessionId,
          provider_session_id: checkoutSession.checkoutSessionId,
        })
        .eq("id", result.order.id),
      supabase
        .from("checkout_intents")
        .update({
          status: "ready",
          provider: "stripe",
          provider_checkout_id: checkoutSession.checkoutSessionId,
          metadata: {
            ...(result.intent.metadata as Record<string, unknown>),
            stripe_checkout_session_id: checkoutSession.checkoutSessionId,
          },
        })
        .eq("id", result.intent.id),
    ]);

    return apiOk({
      ...result,
      checkout: {
        ...result.checkout,
        url: checkoutSession.url,
        checkoutSessionId: checkoutSession.checkoutSessionId,
      },
    });
  }

  return apiOk(result);
}
