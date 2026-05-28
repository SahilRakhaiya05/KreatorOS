import { apiError, apiOk } from "@/server/api/responses";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { getSession } from "@/server/auth/getSession";
import { validatePageDsl } from "@/server/pages/validatePageDsl";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

const dslBlockToRecordType: Record<string, string> = {
  link: "link",
  calendar: "calendar",
  product: "product",
  membership: "membership",
  lead_magnet: "lead_magnet",
  brand_intake: "brand_intake",
  ai_concierge: "ai_concierge",
  hero: "link",
};

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

  const valid = validatePageDsl(version.dsl);
  if (!valid.ok) return apiError("invalid_dsl", "Stored page version is invalid.", 422, valid.issues);

  const { data: pageBefore } = await supabase.from("creator_pages").select("*").eq("id", id).maybeSingle();
  const seoTitle = valid.data.page.seo.title;
  const seoDescription = valid.data.page.seo.description;
  const themeName = valid.data.page.theme.accent || pageBefore?.theme_name || "Studio";

  const { data: pageAfter, error: pageError } = await supabase
    .from("creator_pages")
    .update({
      display_name: seoTitle || pageBefore?.display_name,
      bio: seoDescription || pageBefore?.bio,
      theme_name: themeName,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (pageError) return apiError("page_restore_failed", pageError.message, 400);

  const { data: existingBlocks } = await supabase.from("creator_page_blocks").select("*").eq("page_id", id);
  const existingById = new Map((existingBlocks ?? []).map((block) => [block.id, block]));
  const restoredBlockIds = new Set<string>();

  for (const [index, block] of valid.data.page.blocks.entries()) {
    const props = block.props;
    const title = typeof props.title === "string" ? props.title : block.type;
    const subtitle = typeof props.subtitle === "string" ? props.subtitle : null;
    const url = typeof props.url === "string" ? props.url : null;
    const status = props.status === "draft" ? "draft" : "live";
    const metadata = typeof props.metadata === "object" && props.metadata ? props.metadata : {};

    if (existingById.has(block.id)) {
      await supabase
        .from("creator_page_blocks")
        .update({
          type: dslBlockToRecordType[block.type] ?? "link",
          title,
          subtitle,
          url,
          status,
          sort_order: index,
          metadata,
        })
        .eq("id", block.id)
        .eq("page_id", id);
      restoredBlockIds.add(block.id);
    } else {
      const { data: inserted } = await supabase
        .from("creator_page_blocks")
        .insert({
          id: block.id,
          page_id: id,
          workspace_id: version.workspace_id,
          type: dslBlockToRecordType[block.type] ?? "link",
          title,
          subtitle,
          url,
          status,
          sort_order: index,
          metadata,
        })
        .select("id")
        .maybeSingle();
      if (inserted?.id) restoredBlockIds.add(inserted.id);
    }
  }

  for (const block of existingBlocks ?? []) {
    if (!restoredBlockIds.has(block.id)) {
      await supabase.from("creator_page_blocks").update({ status: "draft" }).eq("id", block.id).eq("page_id", id);
    }
  }

  await writeAuditLog({
    workspaceId: version.workspace_id,
    pageId: id,
    actorType: "creator",
    actorId: user.id,
    action: "page.version.restored",
    targetType: "page_version",
    targetId: versionId,
    before: pageBefore,
    after: { page: pageAfter, dsl: version.dsl },
  });

  return apiOk({ status: "restored", version, page: pageAfter });
}
