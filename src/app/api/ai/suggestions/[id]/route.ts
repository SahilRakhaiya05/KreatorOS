import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { aiSuggestionUpdateSchema } from "@/server/api/schemas";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to update suggestions.", 401);

  const body = await parseJsonBody(req, aiSuggestionUpdateSchema);
  if (isApiResponse(body)) return body;

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const update =
    body.status === "approved"
      ? { status: body.status, approved_by: user.id, approved_at: new Date().toISOString() }
      : { status: body.status, approved_by: null, approved_at: null };

  const { data, error } = await supabase
    .from("ai_suggestions")
    .update(update)
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .select("*")
    .single();

  if (error) return apiError("suggestion_update_failed", error.message, 400);
  return apiOk({ suggestion: data });
}
