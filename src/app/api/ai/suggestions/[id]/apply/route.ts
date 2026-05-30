import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { emitEvent } from "@/server/events/emitEvent";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

type SuggestionOperation = {
  op?: string;
  pageId?: string;
  blockId?: string;
  offerId?: string;
  customLinkId?: string;
  update?: Record<string, unknown>;
  blockType?: string;
  title?: string;
  subtitle?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to apply suggestions.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: suggestion, error } = await supabase.from("ai_suggestions").select("*").eq("id", id).maybeSingle();

  if (error) return apiError("suggestion_read_failed", error.message, 400);
  if (!suggestion) return apiError("not_found", "Suggestion not found.", 404);
  if (suggestion.risk_level !== "low" && suggestion.status !== "approved") {
    return apiError("approval_required", "Medium and high risk suggestions must be approved before applying.", 409);
  }

  const operations = Array.isArray(suggestion.patch?.operations) ? suggestion.patch.operations as SuggestionOperation[] : [];
  const applied: Array<Record<string, unknown>> = [];

  for (const operation of operations) {
    if (operation.op === "update_page" && operation.pageId && operation.update) {
      const update = {
        ...(typeof operation.update.bio === "string" ? { bio: operation.update.bio } : {}),
        ...(typeof operation.update.layout === "string" ? { layout: operation.update.layout } : {}),
        ...(typeof operation.update.theme_name === "string" ? { theme_name: operation.update.theme_name } : {}),
      };
      await supabase.from("creator_pages").update(update).eq("id", operation.pageId);
      applied.push({ op: operation.op, pageId: operation.pageId });
    }

    if (operation.op === "update_block" && operation.pageId && operation.blockId && operation.update) {
      const update = {
        ...(typeof operation.update.title === "string" ? { title: operation.update.title } : {}),
        ...(typeof operation.update.subtitle === "string" ? { subtitle: operation.update.subtitle } : {}),
        ...(typeof operation.update.description === "string" ? { description: operation.update.description } : {}),
        ...(typeof operation.update.url === "string" ? { url: operation.update.url } : {}),
        ...(typeof operation.update.target_url === "string" ? { target_url: operation.update.target_url } : {}),
        ...(typeof operation.update.image_url === "string" ? { image_url: operation.update.image_url } : {}),
        ...(typeof operation.update.status === "string" ? { status: operation.update.status } : {}),
        ...(typeof operation.update.is_visible === "boolean" ? { is_visible: operation.update.is_visible } : {}),
        ...(typeof operation.update.metadata === "object" && operation.update.metadata ? { metadata: operation.update.metadata } : {}),
        ...(typeof operation.update.style === "object" && operation.update.style ? { style: operation.update.style } : {}),
      };
      await supabase.from("creator_page_blocks").update(update).eq("id", operation.blockId).eq("page_id", operation.pageId);
      applied.push({ op: operation.op, pageId: operation.pageId, blockId: operation.blockId });
    }

    if (operation.op === "create_offer") {
      const { type, title, priceCents, description, slug, config } = operation as any;
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
          workspace_id: suggestion.workspace_id,
          page_id: suggestion.page_id,
          owner_id: user.id,
          type,
          title,
          slug,
          description,
          price_cents: priceCents,
          config: config || {},
          status: "published",
        })
        .select("*")
        .single();
      
      if (offerError) return apiError("create_offer_failed", offerError.message, 400);

      let blockType = "link";
      if (type === "booking") blockType = "calendar";
      else if (type === "product") blockType = "product";
      else if (type === "membership") blockType = "membership";
      else if (type === "lead_magnet") blockType = "lead_magnet";

      const { count } = await supabase
        .from("creator_page_blocks")
        .select("id", { count: "exact", head: true })
        .eq("page_id", suggestion.page_id || "");

      const { error: blockError } = await supabase
        .from("creator_page_blocks")
        .insert({
          page_id: suggestion.page_id,
          type: blockType,
          title,
          subtitle: description || "",
          status: "live",
          sort_order: (count || 0) + 1,
          metadata: { offer_id: offer.id },
        });

      if (blockError) return apiError("create_block_failed", blockError.message, 400);
      applied.push({ op: operation.op, offerId: offer.id });
    }

    if (operation.op === "update_offer" && operation.offerId && operation.update) {
      const update = {
        ...(typeof operation.update.title === "string" ? { title: operation.update.title } : {}),
        ...(typeof operation.update.description === "string" ? { description: operation.update.description } : {}),
        ...(typeof operation.update.price_cents === "number" ? { price_cents: operation.update.price_cents } : {}),
        ...(typeof operation.update.currency === "string" ? { currency: operation.update.currency } : {}),
        ...(typeof operation.update.status === "string" ? { status: operation.update.status } : {}),
        ...(typeof operation.update.cover_url === "string" ? { cover_url: operation.update.cover_url } : {}),
        ...(typeof operation.update.config === "object" && operation.update.config ? { config: operation.update.config } : {}),
        ...(typeof operation.update.show_on_bio === "boolean" ? { show_on_bio: operation.update.show_on_bio } : {}),
        ...(typeof operation.update.show_on_shop === "boolean" ? { show_on_shop: operation.update.show_on_shop } : {}),
      };

      const { error: offerError } = await supabase
        .from("offers")
        .update(update)
        .eq("id", operation.offerId)
        .eq("workspace_id", suggestion.workspace_id);

      if (offerError) return apiError("update_offer_failed", offerError.message, 400);
      applied.push({ op: operation.op, offerId: operation.offerId });
    }

    if (operation.op === "delete_offer" && operation.offerId) {
      const { error: offerError } = await supabase
        .from("offers")
        .delete()
        .eq("id", operation.offerId)
        .eq("workspace_id", suggestion.workspace_id);

      if (offerError) return apiError("delete_offer_failed", offerError.message, 400);
      applied.push({ op: operation.op, offerId: operation.offerId });
    }

    if (operation.op === "create_custom_link" && suggestion.page_id) {
      const { title, url, description, image_url, icon, is_visible, metadata } = operation as any;
      const { count } = await supabase
        .from("custom_links")
        .select("id", { count: "exact", head: true })
        .eq("page_id", suggestion.page_id);

      const { data: link, error: linkError } = await supabase
        .from("custom_links")
        .insert({
          workspace_id: suggestion.workspace_id,
          page_id: suggestion.page_id,
          owner_id: user.id,
          title,
          url,
          description: description || null,
          image_url: image_url || null,
          icon: icon || "link",
          is_visible: typeof is_visible === "boolean" ? is_visible : true,
          sort_order: count ?? 0,
          metadata: metadata || {},
        })
        .select("id")
        .single();

      if (linkError) return apiError("create_custom_link_failed", linkError.message, 400);
      applied.push({ op: operation.op, customLinkId: link.id });
    }

    if (operation.op === "update_custom_link" && operation.customLinkId && operation.update) {
      const update = {
        ...(typeof operation.update.title === "string" ? { title: operation.update.title } : {}),
        ...(typeof operation.update.url === "string" ? { url: operation.update.url } : {}),
        ...(typeof operation.update.description === "string" ? { description: operation.update.description } : {}),
        ...(typeof operation.update.image_url === "string" ? { image_url: operation.update.image_url } : {}),
        ...(typeof operation.update.icon === "string" ? { icon: operation.update.icon } : {}),
        ...(typeof operation.update.is_visible === "boolean" ? { is_visible: operation.update.is_visible } : {}),
        ...(typeof operation.update.metadata === "object" && operation.update.metadata ? { metadata: operation.update.metadata } : {}),
      };

      const { error: linkError } = await supabase
        .from("custom_links")
        .update(update)
        .eq("id", operation.customLinkId)
        .eq("workspace_id", suggestion.workspace_id);

      if (linkError) return apiError("update_custom_link_failed", linkError.message, 400);
      applied.push({ op: operation.op, customLinkId: operation.customLinkId });
    }

    if (operation.op === "delete_custom_link" && operation.customLinkId) {
      const { error: linkError } = await supabase
        .from("custom_links")
        .delete()
        .eq("id", operation.customLinkId)
        .eq("workspace_id", suggestion.workspace_id);

      if (linkError) return apiError("delete_custom_link_failed", linkError.message, 400);
      applied.push({ op: operation.op, customLinkId: operation.customLinkId });
    }

    if (operation.op === "create_block") {
      const { blockType, title, subtitle, description, url, target_url, status, is_visible, metadata } = operation as any;
      const { count } = await supabase
        .from("creator_page_blocks")
        .select("id", { count: "exact", head: true })
        .eq("page_id", suggestion.page_id || "");

      const { error: blockError } = await supabase
        .from("creator_page_blocks")
        .insert({
          page_id: suggestion.page_id,
          type: blockType || "link",
          title,
          subtitle: subtitle || "",
          description: description || "",
          url: url || "",
          target_url: target_url || "",
          status: status || "live",
          ...(typeof is_visible === "boolean" ? { is_visible } : {}),
          sort_order: (count || 0) + 1,
          metadata: metadata || {},
        });

      if (blockError) return apiError("create_block_failed", blockError.message, 400);
      applied.push({ op: operation.op, title });
    }

    if (operation.op === "delete_block" && operation.blockId) {
      const { error: deleteError } = await supabase
        .from("creator_page_blocks")
        .delete()
        .eq("id", operation.blockId);

      if (deleteError) return apiError("delete_block_failed", deleteError.message, 400);
      applied.push({ op: operation.op, blockId: operation.blockId });
    }
  }

  const { data: updatedSuggestion } = await supabase
    .from("ai_suggestions")
    .update({ status: "applied" })
    .eq("id", id)
    .select("*")
    .single();

  await writeAuditLog({
    workspaceId: suggestion.workspace_id,
    pageId: suggestion.page_id,
    actorType: "creator",
    actorId: user.id,
    action: "ai.suggestion.applied",
    targetType: "ai_suggestion",
    targetId: id,
    before: suggestion,
    after: { suggestion: updatedSuggestion, applied },
  });

  await emitEvent({
    type: "ai.suggestion.applied",
    workspaceId: suggestion.workspace_id,
    pageId: suggestion.page_id ?? undefined,
    actorType: "creator",
    actorId: user.id,
    payload: { suggestionId: id, applied },
    idempotencyKey: `ai_suggestion_applied:${id}`,
  });

  return apiOk({ suggestion: updatedSuggestion, applied });
}
