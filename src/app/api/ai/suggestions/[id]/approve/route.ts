import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { emitEvent } from "@/server/events/emitEvent";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to approve suggestions.", 401);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_suggestions")
    .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return apiError("approval_failed", error.message, 400);

  await emitEvent({
    type: "ai.suggestion.approved",
    workspaceId: data.workspace_id,
    pageId: data.page_id ?? undefined,
    actorType: "creator",
    actorId: user.id,
    payload: { suggestionId: id },
    idempotencyKey: `ai_suggestion_approved:${id}`,
  });

  return apiOk({ suggestion: data });
}
