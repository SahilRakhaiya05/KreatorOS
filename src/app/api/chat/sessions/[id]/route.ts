import { apiError, apiOk } from "@/server/api/responses";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to delete chat history.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("creator_chat_sessions")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .eq("created_by", user.id);

  if (error) return apiError("chat_delete_failed", error.message, 400);
  return apiOk({ deleted: true });
}
