import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workspaceMemberUpdateSchema } from "@/server/api/schemas";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { getSession } from "@/server/auth/getSession";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list workspace members.", 401);

  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*, profiles(id,email,full_name,avatar_url)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) return apiError("members_list_failed", error.message, 400);
  return apiOk({ members: data ?? [] });
}

export async function PATCH(req: Request) {
  const body = await parseJsonBody(req, workspaceMemberUpdateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to update workspace members.", 401);

  const supabase = await createSupabaseServerClient();
  const update = {
    ...(body.role ? { role: body.role } : {}),
    ...(body.status ? { status: body.status } : {}),
    ...(body.permissions ? { permissions: body.permissions } : {}),
  };

  const { data, error } = await supabase
    .from("workspace_members")
    .update(update)
    .eq("workspace_id", body.workspaceId)
    .eq("user_id", body.userId)
    .select("*")
    .single();

  if (error) return apiError("member_update_failed", error.message, 400);

  await writeAuditLog({
    workspaceId: body.workspaceId,
    actorType: "creator",
    actorId: user.id,
    action: "workspace.member.updated",
    targetType: "workspace_member",
    targetId: data.id,
    after: data,
  });

  return apiOk({ member: data });
}
