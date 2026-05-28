import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { permissionCheckSchema } from "@/server/api/schemas";
import { routeSurfaceWorkspaceTypes } from "@/server/auth/permissions";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, permissionCheckSchema);
  if (isApiResponse(body)) return body;

  const supabase = await createSupabaseServerClient();
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id,type,status")
    .eq("id", body.workspaceId)
    .maybeSingle();

  if (error) return apiError("permission_check_failed", error.message, 400);
  const allowed = Boolean(
    workspace?.status === "active" &&
      routeSurfaceWorkspaceTypes[body.surface].includes(workspace.type),
  );

  return apiOk({ allowed, workspace });
}
