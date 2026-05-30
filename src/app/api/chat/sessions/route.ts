import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { chatSessionSaveSchema } from "@/server/api/schemas";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to load chat history.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_chat_sessions")
    .select("id,title,agent_id,messages,updated_at")
    .eq("workspace_id", workspace.id)
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) return apiError("chat_history_failed", error.message, 400);
  return apiOk({ sessions: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to save chat history.", 401);

  const body = await parseJsonBody(req, chatSessionSaveSchema);
  if (isApiResponse(body)) return body;

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const row = {
    ...(body.id ? { id: body.id } : {}),
    workspace_id: workspace.id,
    created_by: user.id,
    title: body.title,
    agent_id: body.agentId,
    messages: body.messages,
  };

  const { data, error } = await supabase
    .from("creator_chat_sessions")
    .upsert(row, { onConflict: "id" })
    .select("id,title,agent_id,messages,updated_at")
    .single();

  if (error) return apiError("chat_save_failed", error.message, 400);
  return apiOk({ session: data });
}
