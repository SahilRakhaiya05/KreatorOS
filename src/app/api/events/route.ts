import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { eventSchema } from "@/server/api/schemas";
import { emitEvent } from "@/server/events/emitEvent";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, eventSchema);
  if (isApiResponse(body)) return body;

  const result = await emitEvent(body);
  return apiOk(result);
}
