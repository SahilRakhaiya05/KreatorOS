import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { pageUpdateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to read page records.", 401);

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("creator_pages").select("*").eq("id", id).maybeSingle();
  if (error) return apiError("page_read_failed", error.message, 400);
  if (!data) return apiError("not_found", "Page not found.", 404);
  return apiOk({ page: data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to update page records.", 401);

  const body = await parseJsonBody(req, pageUpdateSchema);
  if (isApiResponse(body)) return body;

  const update = {
    ...(body.slug ? { slug: body.slug } : {}),
    ...(body.themeName ? { theme_name: body.themeName } : {}),
    ...(body.layout ? { layout: body.layout } : {}),
    ...(body.bio !== undefined ? { bio: body.bio || null } : {}),
    ...(body.displayName ? { display_name: body.displayName } : {}),
    ...(body.handle ? { handle: body.handle } : {}),
    ...(body.isPublished !== undefined ? { is_published: body.isPublished } : {}),
  };

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("creator_pages").select("*").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("creator_pages").update(update).eq("id", id).select("*").single();

  if (error) return apiError("page_update_failed", error.message, 400);

  await writeAuditLog({
    workspaceId: data.workspace_id ?? null,
    pageId: id,
    ownerId: data.owner_id,
    actorType: "creator",
    actorId: user.id,
    action: "page.updated",
    targetType: "creator_page",
    targetId: id,
    before,
    after: data,
  });

  return apiOk({ page: data });
}
