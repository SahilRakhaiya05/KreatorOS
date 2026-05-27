import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { whatsappMessageSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, whatsappMessageSchema);
  if (isApiResponse(body)) return body;

  // TODO: validate template approval, opt-in, rate limits, and send via WhatsApp Cloud API.
  return apiOk({ status: "queued", body });
}
