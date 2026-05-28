import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { calendarEventSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create calendar events.", 401);

  const body = await parseJsonBody(req, calendarEventSchema);
  if (isApiResponse(body)) return body;

  // TODO: execute only through a connected calendar provider adapter.
  return apiError("provider_not_configured", "Connect Google Calendar or Cal.com to create real events.", 409, body);
}
