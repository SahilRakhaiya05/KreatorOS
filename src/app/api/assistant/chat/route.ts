import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { publicAssistantChatSchema } from "@/server/api/schemas";
import { replyToPublicAssistant } from "@/server/assistants/publicAssistant";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, publicAssistantChatSchema);
  if (isApiResponse(body)) return body;

  const result = await replyToPublicAssistant(body);
  if (!result.ok) return apiError("assistant_chat_failed", result.message, 400);

  return apiOk(result);
}
