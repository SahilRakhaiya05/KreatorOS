import { apiError, apiOk } from "@/server/api/responses";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const { id, versionId } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to restore page versions.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: version, error } = await supabase
    .from("page_versions")
    .select("*")
    .eq("id", versionId)
    .eq("page_id", id)
    .maybeSingle();

  if (error) return apiError("version_restore_failed", error.message, 400);
  if (!version) return apiError("not_found", "Page version not found.", 404);

  await writeAuditLog({
    workspaceId: version.workspace_id,
    pageId: id,
    actorType: "creator",
    actorId: user.id,
    action: "page.version.restore_requested",
    targetType: "page_version",
    targetId: versionId,
    after: version.dsl,
  });

  return apiOk({ status: "restore_ready", version });
}
