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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "offer";
}

function normalizeCurrency(value: unknown) {
  return typeof value === "string" && /^[a-z]{3}$/i.test(value) ? value.toLowerCase() : "usd";
}

function normalizeProductStatus(value: unknown) {
  return ["draft", "published", "paused", "archived"].includes(String(value)) ? String(value) : "published";
}

async function uniqueProductSlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, pageId: string, title: string, currentProductId?: string) {
  const base = slugify(title);
  const candidates = [base, `${base}-${crypto.randomUUID().slice(0, 6)}`];

  for (const candidate of candidates) {
    let query = supabase.from("digital_products").select("id").eq("page_id", pageId).eq("slug", candidate).limit(1);
    if (currentProductId) query = query.neq("id", currentProductId);
    const { data } = await query;
    if (!data?.length) return candidate;
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

async function syncOfferProductSurface(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  workspaceId: string;
  pageId?: string | null;
  ownerId: string;
  offer: Record<string, any>;
  operation?: Record<string, any>;
}) {
  const { supabase, workspaceId, pageId, ownerId, offer, operation = {} } = input;
  const targetPageId = pageId ?? offer.page_id;
  if (!targetPageId) return { product: null };

  const status = normalizeProductStatus(operation.status ?? offer.status);
  const showOnBio = typeof operation.showOnBio === "boolean"
    ? operation.showOnBio
    : typeof operation.show_on_bio === "boolean"
      ? operation.show_on_bio
      : typeof offer.show_on_bio === "boolean"
        ? offer.show_on_bio
        : true;
  const showOnShop = typeof operation.showOnShop === "boolean"
    ? operation.showOnShop
    : typeof operation.show_on_shop === "boolean"
      ? operation.show_on_shop
      : typeof offer.show_on_shop === "boolean"
        ? offer.show_on_shop
        : true;
  const title = String(operation.title ?? offer.title ?? "Untitled offer");
  const description = typeof operation.description === "string" ? operation.description : offer.description ?? null;
  const priceCents = typeof operation.priceCents === "number"
    ? operation.priceCents
    : typeof operation.price_cents === "number"
      ? operation.price_cents
      : offer.price_cents ?? 0;
  const currency = normalizeCurrency(operation.currency ?? offer.currency);
  const coverImageUrl = typeof operation.coverImageUrl === "string"
    ? operation.coverImageUrl
    : typeof operation.cover_image_url === "string"
      ? operation.cover_image_url
      : typeof offer.cover_url === "string"
        ? offer.cover_url
        : null;
  const metadata = {
    source: "ai_operator",
    offer_type: offer.type,
    offer_slug: offer.slug,
    config: operation.config ?? offer.config ?? {},
  };

  const { data: existingProduct } = await supabase
    .from("digital_products")
    .select("*")
    .eq("offer_id", offer.id)
    .eq("page_id", targetPageId)
    .maybeSingle();

  const productSlug =
    existingProduct && operation.title !== undefined
      ? await uniqueProductSlug(supabase, targetPageId, title, existingProduct.id)
      : existingProduct?.slug ?? await uniqueProductSlug(supabase, targetPageId, title);

  const productPayload = {
    workspace_id: workspaceId,
    owner_id: ownerId,
    page_id: targetPageId,
    offer_id: offer.id,
    title,
    slug: productSlug,
    description,
    cover_image_url: coverImageUrl,
    external_delivery_url: typeof operation.externalDeliveryUrl === "string" ? operation.externalDeliveryUrl : null,
    price_cents: priceCents,
    currency,
    status,
    show_on_bio: showOnBio,
    show_on_shop: showOnShop,
    metadata,
  };

  const productResult = existingProduct
    ? await supabase.from("digital_products").update(productPayload).eq("id", existingProduct.id).select("*").single()
    : await supabase.from("digital_products").insert(productPayload).select("*").single();

  if (productResult.error) throw productResult.error;
  const product = productResult.data;

  const { data: existingBlock } = await supabase
    .from("creator_page_blocks")
    .select("id")
    .eq("page_id", targetPageId)
    .eq("ref_type", "digital_product")
    .eq("ref_id", product.id)
    .maybeSingle();

  const blockPayload = {
    workspace_id: workspaceId,
    page_id: targetPageId,
    type: offer.type === "membership" ? "membership" : offer.type === "booking" ? "calendar" : offer.type === "lead_magnet" ? "lead_magnet" : "product",
    title,
    subtitle: description ?? "Digital product",
    description,
    image_url: coverImageUrl,
    status: status === "published" ? "live" : "draft",
    is_visible: status === "published" && showOnBio,
    metadata: { price_cents: priceCents, currency, product_slug: product.slug, offer_id: offer.id },
    ref_type: "digital_product",
    ref_id: product.id,
  };

  if (existingBlock) {
    await supabase.from("creator_page_blocks").update(blockPayload).eq("id", existingBlock.id);
  } else if (showOnBio) {
    const { count } = await supabase
      .from("creator_page_blocks")
      .select("id", { count: "exact", head: true })
      .eq("page_id", targetPageId);

    await supabase.from("creator_page_blocks").insert({ ...blockPayload, sort_order: (count || 0) + 1 });
  }

  return { product };
}

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
      const { type, title, priceCents, description, slug, config, currency, status, showOnBio, showOnShop, coverImageUrl } = operation as any;
      const offerStatus = normalizeProductStatus(status);
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
          workspace_id: suggestion.workspace_id,
          page_id: suggestion.page_id,
          owner_id: user.id,
          type,
          title,
          slug: slug || slugify(title),
          description,
          price_cents: priceCents,
          currency: normalizeCurrency(currency),
          config: {
            ...(config || {}),
            showOnBio: typeof showOnBio === "boolean" ? showOnBio : true,
            showOnShop: typeof showOnShop === "boolean" ? showOnShop : true,
          },
          cover_url: coverImageUrl || null,
          show_on_bio: typeof showOnBio === "boolean" ? showOnBio : true,
          show_on_shop: typeof showOnShop === "boolean" ? showOnShop : true,
          status: offerStatus,
          published_at: offerStatus === "published" ? new Date().toISOString() : null,
        })
        .select("*")
        .single();
      
      if (offerError) return apiError("create_offer_failed", offerError.message, 400);

      try {
        const { product } = await syncOfferProductSurface({
          supabase,
          workspaceId: suggestion.workspace_id,
          pageId: suggestion.page_id,
          ownerId: user.id,
          offer,
          operation: {
            ...operation,
            status: offerStatus,
            currency: normalizeCurrency(currency),
            showOnBio: typeof showOnBio === "boolean" ? showOnBio : true,
            showOnShop: typeof showOnShop === "boolean" ? showOnShop : true,
          },
        });
        applied.push({ op: operation.op, offerId: offer.id, productId: product?.id });
      } catch (syncError) {
        return apiError("sync_product_failed", syncError instanceof Error ? syncError.message : "Could not sync product surface.", 400);
      }
    }

    if (operation.op === "update_offer" && operation.offerId && operation.update) {
      const update = {
        ...(typeof operation.update.title === "string" ? { title: operation.update.title } : {}),
        ...(typeof operation.update.description === "string" ? { description: operation.update.description } : {}),
        ...(typeof operation.update.price_cents === "number" ? { price_cents: operation.update.price_cents } : {}),
        ...(typeof operation.update.currency === "string" ? { currency: operation.update.currency } : {}),
        ...(typeof operation.update.status === "string" ? { status: operation.update.status } : {}),
        ...(typeof operation.update.cover_url === "string" ? { cover_url: operation.update.cover_url } : {}),
        ...(typeof operation.update.coverImageUrl === "string" ? { cover_url: operation.update.coverImageUrl } : {}),
        ...(typeof operation.update.config === "object" && operation.update.config ? { config: operation.update.config } : {}),
        ...(typeof operation.update.show_on_bio === "boolean" ? { show_on_bio: operation.update.show_on_bio } : {}),
        ...(typeof operation.update.show_on_shop === "boolean" ? { show_on_shop: operation.update.show_on_shop } : {}),
        ...(typeof operation.update.showOnBio === "boolean" ? { show_on_bio: operation.update.showOnBio } : {}),
        ...(typeof operation.update.showOnShop === "boolean" ? { show_on_shop: operation.update.showOnShop } : {}),
        ...(operation.update.status === "published" ? { published_at: new Date().toISOString() } : {}),
      };

      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .update(update)
        .eq("id", operation.offerId)
        .eq("workspace_id", suggestion.workspace_id)
        .select("*")
        .single();

      if (offerError) return apiError("update_offer_failed", offerError.message, 400);

      try {
        const { product } = await syncOfferProductSurface({
          supabase,
          workspaceId: suggestion.workspace_id,
          pageId: offer.page_id ?? suggestion.page_id,
          ownerId: user.id,
          offer,
          operation: operation.update as Record<string, any>,
        });
        applied.push({ op: operation.op, offerId: operation.offerId, productId: product?.id });
      } catch (syncError) {
        return apiError("sync_product_failed", syncError instanceof Error ? syncError.message : "Could not sync product surface.", 400);
      }
    }

    if (operation.op === "delete_offer" && operation.offerId) {
      const { data: linkedProducts } = await supabase
        .from("digital_products")
        .select("id")
        .eq("offer_id", operation.offerId)
        .eq("workspace_id", suggestion.workspace_id);

      const productIds = (linkedProducts ?? []).map((product) => product.id);
      if (productIds.length) {
        await supabase
          .from("creator_page_blocks")
          .delete()
          .eq("ref_type", "digital_product")
          .in("ref_id", productIds);

        const { error: productError } = await supabase
          .from("digital_products")
          .delete()
          .in("id", productIds)
          .eq("workspace_id", suggestion.workspace_id);

        if (productError) return apiError("delete_product_failed", productError.message, 400);
      }

      const { error: offerError } = await supabase
        .from("offers")
        .delete()
        .eq("id", operation.offerId)
        .eq("workspace_id", suggestion.workspace_id);

      if (offerError) return apiError("delete_offer_failed", offerError.message, 400);
      applied.push({ op: operation.op, offerId: operation.offerId, productIds });
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
