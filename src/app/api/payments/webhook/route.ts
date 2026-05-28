import { apiError, apiOk } from "@/server/api/responses";
import { paymentService } from "@/server/payments/paymentService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature") || "";
  const rawBody = await req.text();

  const result = await paymentService.handleWebhook(rawBody, signature);
  if (!result.ok) {
    return apiError("webhook_error", result.error || "Failed to process webhook.", 400);
  }

  return apiOk({ received: true });
}
