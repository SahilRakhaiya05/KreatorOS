import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workspaceMemberUpdateSchema } from "@/server/api/schemas";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
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
  return apiOk({ member: data });
}
