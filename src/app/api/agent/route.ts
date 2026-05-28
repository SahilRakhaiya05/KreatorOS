import { agentRequestSchema } from "@/server/api/schemas";
import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { apiError } from "@/server/api/responses";
import { createAiSuggestion } from "@/server/ai/createSuggestion";
import { runOrchestratorAgent } from "@/server/agents/orchestratorAgent";
import { getSession } from "@/server/auth/getSession";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to use the agent.", 401);

  const body = await parseJsonBody(req, agentRequestSchema);
  if (isApiResponse(body)) return body;

  const result = await runOrchestratorAgent({ userMessage: body.userMessage, mode: body.mode });
  const suggestion = await createAiSuggestion({
    workspaceId: body.workspaceId,
    title: "AI operator plan",
    riskLevel: result.riskLevel,
    explanation: result.assistantMessage,
    patch: {
      targetType: "workflow",
      operations: result.proposedToolCalls.map((tool) => ({ tool, status: "proposed" })),
    },
  });

  return apiOk({
    status: result.status,
    workspaceId: body.workspaceId,
    assistantMessage: result.assistantMessage,
    proposedToolCalls: result.proposedToolCalls,
    suggestion: suggestion.ok ? suggestion.data : null,
  });
}
