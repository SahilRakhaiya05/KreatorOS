import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { aiSuggestionCreateSchema } from "@/server/api/schemas";
import { createAiSuggestion } from "@/server/ai/createSuggestion";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list AI suggestions.", 401);

  const url = new URL(req.url);
  const activeWorkspace = await getActiveWorkspace(user.id);
  const workspaceId = url.searchParams.get("workspaceId") ?? activeWorkspace?.id;
  if (!workspaceId) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("ai_suggestions").select("*").eq("workspace_id", workspaceId);
  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", status);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(Number.isFinite(limit) ? limit : 20);
  if (error) return apiError("ai_suggestions_failed", error.message, 400);
  return apiOk({ suggestions: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create AI suggestions.", 401);

  const body = await parseJsonBody(req, aiSuggestionCreateSchema);
  if (isApiResponse(body)) return body;

  const result = await createAiSuggestion(body);
  if (!result.ok) return apiError("ai_suggestion_failed", "Could not create AI suggestion.", 400, result.error);
  return apiOk({ suggestion: result.data }, { status: 201 });
}
