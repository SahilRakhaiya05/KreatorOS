import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { aiSuggestionCreateSchema } from "@/server/api/schemas";
import { createAiSuggestion } from "@/server/ai/createSuggestion";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list AI suggestions.", 401);

  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("ai_suggestions").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
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
