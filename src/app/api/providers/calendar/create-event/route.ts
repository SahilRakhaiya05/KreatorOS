import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { calendarEventSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, calendarEventSchema);
  if (isApiResponse(body)) return body;

  // TODO: Google/Microsoft calendar adapter.
  return apiOk({ status: "event_created", providerEventId: "evt_demo", body });
}
