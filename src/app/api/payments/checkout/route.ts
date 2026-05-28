import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { checkoutSchema } from "@/server/api/schemas";
import { createCheckoutIntent } from "@/server/checkout/createCheckoutIntent";

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

  return apiOk(result);
}
