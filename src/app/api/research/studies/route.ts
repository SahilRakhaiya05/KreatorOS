import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { researchStudySchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, researchStudySchema);
  if (isApiResponse(body)) return body;

  // TODO: import participants, create research script, schedule interviews, create outreach messages.
  return apiOk({ status: "study_created", automation: ["outreach", "scheduling", "ai_interview", "transcription", "themes"], body });
}
