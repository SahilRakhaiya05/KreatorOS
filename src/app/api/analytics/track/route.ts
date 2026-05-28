import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { analyticsTrackSchema } from "@/server/api/schemas";
import { recordEvent } from "@/server/analytics/recordEvent";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, analyticsTrackSchema);
  if (isApiResponse(body)) return body;

  const result = await recordEvent(body);
  return apiOk(result);
}
