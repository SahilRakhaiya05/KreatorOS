import { agentRequestSchema } from "@/server/api/schemas";
import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { apiError } from "@/server/api/responses";
import { createAiSuggestion } from "@/server/ai/createSuggestion";
import { runOrchestratorAgent } from "@/server/agents/orchestratorAgent";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to use the agent.", 401);

  const body = await parseJsonBody(req, agentRequestSchema);
  if (isApiResponse(body)) return body;

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace || workspace.id !== body.workspaceId) {
    return apiError("forbidden", "Switch to this workspace before running its agent.", 403);
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: offers }, { data: page }, { count: pendingSuggestions }] = await Promise.all([
    supabase
      .from("offers")
      .select("id,title,type,price_cents,status,slug")
      .eq("workspace_id", workspace.id)
      .limit(12),
    supabase
      .from("creator_pages")
      .select("id,display_name,slug,bio,is_published")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("ai_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("status", "pending"),
  ]);

  const result = await runOrchestratorAgent({
    userMessage: body.userMessage,
    mode: body.mode,
    workspaceContext: {
      workspace: { id: workspace.id, type: workspace.type, role: workspace.role },
      page,
      offers: offers ?? [],
      pendingSuggestions: pendingSuggestions ?? 0,
    },
  });

  const suggestion = await createAiSuggestion({
    workspaceId: body.workspaceId,
    title: result.suggestionTitle ?? "AI operator plan",
    riskLevel: result.riskLevel,
    explanation: result.assistantMessage,
    patch: result.patch ?? {
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
