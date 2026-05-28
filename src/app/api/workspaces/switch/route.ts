import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workspaceSwitchSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, workspaceSwitchSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to switch workspace.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", body.workspaceId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) return apiError("forbidden", "You are not a member of this workspace.", 403);

  const { data: profile } = await supabase.from("profiles").select("active_workspace_id").eq("id", user.id).maybeSingle();
  await supabase.from("profiles").update({ active_workspace_id: body.workspaceId }).eq("id", user.id);
  await supabase.from("workspace_switch_logs").insert({
    user_id: user.id,
    from_workspace_id: profile?.active_workspace_id ?? null,
    to_workspace_id: body.workspaceId,
  });

  await writeAuditLog({
    workspaceId: body.workspaceId,
    actorType: "creator",
    actorId: user.id,
    action: "workspace.switched",
    targetType: "workspace",
    targetId: body.workspaceId,
    before: { activeWorkspaceId: profile?.active_workspace_id ?? null },
    after: { activeWorkspaceId: body.workspaceId },
  });

  return apiOk({ activeWorkspaceId: body.workspaceId });
}
