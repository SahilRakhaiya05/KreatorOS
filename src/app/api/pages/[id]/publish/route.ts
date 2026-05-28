import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to publish pages.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("creator_pages").select("*").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("creator_pages").update({ is_published: true }).eq("id", id).select("*").single();
  if (error) return apiError("page_publish_failed", error.message, 400);

  await writeAuditLog({
    workspaceId: data.workspace_id ?? null,
    pageId: id,
    ownerId: data.owner_id,
    actorType: "creator",
    actorId: user.id,
    action: "page.published",
    targetType: "creator_page",
    targetId: id,
    before,
    after: data,
  });

  return apiOk({ page: data });
}
