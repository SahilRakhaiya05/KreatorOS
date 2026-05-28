import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { assistantLeadSchema } from "@/server/api/schemas";
import { captureAssistantLead } from "@/server/assistants/publicAssistant";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, assistantLeadSchema);
  if (isApiResponse(body)) return body;

  const result = await captureAssistantLead(body);
  if (!result.ok) return apiError("lead_capture_failed", result.message, 400);

  return apiOk({ lead: result.lead }, { status: 201 });
}
