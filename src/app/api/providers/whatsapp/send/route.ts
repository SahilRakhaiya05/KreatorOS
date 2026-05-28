import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { whatsappMessageSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to send WhatsApp messages.", 401);

  const body = await parseJsonBody(req, whatsappMessageSchema);
  if (isApiResponse(body)) return body;

  // TODO: validate template approval, opt-in, rate limits, and send via WhatsApp Cloud API.
  return apiError("provider_not_configured", "Connect WhatsApp Business to send WhatsApp messages.", 409, body);
}
