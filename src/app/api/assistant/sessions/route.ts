import { apiError, apiOk } from "@/server/api/responses";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assistant_chat_sessions")
    .select("*, assistant_chat_messages(*)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError("assistant_sessions_failed", error.message, 400);
  return apiOk({ sessions: data ?? [] });
}
