import { agentRequestSchema } from "@/server/api/schemas";
import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, agentRequestSchema);
  if (isApiResponse(body)) return body;

  // TODO: load workspace graph, retrieve knowledge, plan tool calls, enforce policy, write approval queue.
  return apiOk({
    status: "draft_ready",
    workspaceId: body.workspaceId,
    assistantMessage: "I created a guarded plan and placed actions in the approval queue.",
    proposedToolCalls: ["create_page_block", "create_booking_type", "create_workflow", "request_approval"]
  });
}
