import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { pageBlockUpdateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; blockId: string }> }) {
  const { id, blockId } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to update page blocks.", 401);

  const body = await parseJsonBody(req, pageBlockUpdateSchema);
  if (isApiResponse(body)) return body;

  const update = {
    ...(body.title ? { title: body.title } : {}),
    ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}),
    ...(body.url !== undefined ? { url: body.url } : {}),
    ...(body.status ? { status: body.status } : {}),
    ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}),
    ...(body.metadata ? { metadata: body.metadata } : {}),
    ...(body.refType !== undefined ? { ref_type: body.refType } : {}),
    ...(body.refId !== undefined ? { ref_id: body.refId } : {}),
  };

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("creator_page_blocks").select("*").eq("id", blockId).eq("page_id", id).maybeSingle();
  const { data, error } = await supabase
    .from("creator_page_blocks")
    .update(update)
    .eq("id", blockId)
    .eq("page_id", id)
    .select("*")
    .single();

  if (error) return apiError("block_update_failed", error.message, 400);

  await writeAuditLog({
    workspaceId: data.workspace_id ?? null,
    pageId: id,
    actorType: "creator",
    actorId: user.id,
    action: "page.block.updated",
    targetType: "creator_page_block",
    targetId: blockId,
    before,
    after: data,
  });

  return apiOk({ block: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; blockId: string }> }) {
  const { id, blockId } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to delete page blocks.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("creator_page_blocks").select("*").eq("id", blockId).eq("page_id", id).maybeSingle();
  const { error } = await supabase.from("creator_page_blocks").delete().eq("id", blockId).eq("page_id", id);

  if (error) return apiError("block_delete_failed", error.message, 400);

  await writeAuditLog({
    workspaceId: before?.workspace_id ?? null,
    pageId: id,
    actorType: "creator",
    actorId: user.id,
    action: "page.block.deleted",
    targetType: "creator_page_block",
    targetId: blockId,
    before,
  });

  return apiOk({ deleted: true });
}
