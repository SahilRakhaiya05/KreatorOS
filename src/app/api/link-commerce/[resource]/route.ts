import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import {
  linkAffiliateSchema,
  linkAiActionSchema,
  linkContactSchema,
  linkCustomLinkSchema,
  linkGallerySchema,
  linkPageProfileSchema,
  linkProductSchema,
  linkReferralProgramSchema,
  linkSocialLinkSchema,
  linkTrackSchema,
} from "@/server/api/schemas";
import { recordEvent } from "@/server/analytics/recordEvent";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createAiSuggestion } from "@/server/ai/createSuggestion";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { createOffer } from "@/server/offers/createOffer";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "item";
}

async function requireAuth() {
  const { user } = await getSession();
  if (!user) return null;
  return user;
}

async function resolveAccountScope(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  pageId: string,
  providedWorkspaceId?: string | null
) {
  const { data: page, error } = await supabase
    .from("creator_pages")
    .select("id, owner_id, workspace_id")
    .eq("id", pageId)
    .maybeSingle();

  if (error || !page || page.owner_id !== userId) return null;

  const workspace = page.workspace_id || providedWorkspaceId ? null : await getActiveWorkspace(userId);
  return {
    page,
    ownerId: userId,
    workspaceId: page.workspace_id ?? providedWorkspaceId ?? workspace?.id ?? null,
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const supabase = await createSupabaseServerClient();

  if (resource === "track") {
    const body = await parseJsonBody(req, linkTrackSchema);
    if (isApiResponse(body)) return body;

    await recordEvent({
      workspaceId: body.workspaceId,
      pageId: body.pageId,
      eventType: body.eventType,
      visitorId: body.visitorId,
      referrer: req.headers.get("referer"),
      metadata: {
        ...body.metadata,
        refType: body.refType,
        refId: body.refId,
        source: body.source,
        medium: body.medium,
        campaign: body.campaign,
        userAgent: req.headers.get("user-agent"),
      },
    });

    return apiOk({ tracked: true });
  }

  const user = await requireAuth();
  if (!user) return apiError("unauthorized", "Sign in to manage CreatorOS Link Commerce.", 401);

  if (resource === "profile") {
    const body = await parseJsonBody(req, linkPageProfileSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);

    const progressItems = [
      Boolean(body.avatarUrl),
      Boolean(body.backgroundImageUrl),
      Boolean(body.username),
      Boolean(body.bio),
      body.status === "published",
    ];
    const setupProgress = Math.min(100, 20 + progressItems.filter(Boolean).length * 12);
    const update = {
      display_name: body.displayName,
      username: body.username,
      slug: body.username,
      handle: `@${body.username}`,
      headline: body.headline ?? null,
      bio: body.bio ?? null,
      avatar_url: body.avatarUrl || null,
      background_image_url: body.backgroundImageUrl || null,
      status: body.status ?? "draft",
      is_published: body.status === "published",
      published_at: body.status === "published" ? new Date().toISOString() : null,
      setup_progress: setupProgress,
      theme: {
        occupationType: body.occupationType,
        totalFollowers: body.totalFollowers ?? 0,
        mode: body.themeMode ?? "dark",
        accent: body.themeAccent ?? "coral",
      },
      seo: { title: body.displayName, description: body.bio ?? body.headline ?? "" },
    };
    const { data: before } = await supabase.from("creator_pages").select("*").eq("id", body.pageId).maybeSingle();
    const { data, error } = await supabase.from("creator_pages").update(update).eq("id", body.pageId).select("*").single();
    if (error) return apiError("profile_update_failed", error.message, 400);

    await writeAuditLog({
      workspaceId: scope.workspaceId,
      pageId: body.pageId,
      ownerId: scope.ownerId,
      actorType: "creator",
      actorId: user.id,
      action: body.status === "published" ? "page.published" : "page.updated",
      targetType: "creator_page",
      targetId: body.pageId,
      before,
      after: data,
    });
    await recordEvent({ workspaceId: scope.workspaceId, pageId: body.pageId, eventType: "page.updated", metadata: { setupProgress } });
    return apiOk({ page: data });
  }

  if (resource === "social-links") {
    const body = await parseJsonBody(req, linkSocialLinkSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);

    const { data: existing } = await supabase
      .from("creator_social_links")
      .select("id")
      .eq("page_id", body.pageId)
      .eq("platform", body.platform)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabase
        .from("creator_social_links")
        .update({
          url: body.url,
          label: body.label ?? body.platform,
          category: body.category ?? "social",
          icon: body.icon ?? body.platform.toLowerCase(),
          is_visible: body.isVisible,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
    } else {
      result = await supabase
        .from("creator_social_links")
        .insert({
          workspace_id: scope.workspaceId,
          owner_id: scope.ownerId,
          page_id: body.pageId,
          platform: body.platform,
          url: body.url,
          label: body.label ?? body.platform,
          category: body.category ?? "social",
          icon: body.icon ?? body.platform.toLowerCase(),
          is_visible: body.isVisible,
        })
        .select("*")
        .single();
    }

    const { data, error } = result;
    if (error) return apiError("social_link_failed", error.message, 400);
    await recordEvent({ workspaceId: scope.workspaceId, pageId: body.pageId, eventType: "social_link.added", metadata: { platform: body.platform } });
    return apiOk({ socialLink: data }, { status: existing ? 200 : 201 });
  }

  if (resource === "custom-links") {
    const body = await parseJsonBody(req, linkCustomLinkSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);

    if (body.id) {
      const { data, error } = await supabase
        .from("custom_links")
        .update({
          title: body.title,
          url: body.url,
          description: body.description ?? null,
          image_url: body.imageUrl || null,
          icon: body.icon ?? "link",
          is_visible: body.isVisible,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select("*")
        .single();
      if (error) return apiError("custom_link_update_failed", error.message, 400);
      return apiOk({ customLink: data });
    }

    const { data, error } = await supabase
      .from("custom_links")
      .insert({
        workspace_id: scope.workspaceId,
        owner_id: scope.ownerId,
        page_id: body.pageId,
        title: body.title,
        url: body.url,
        description: body.description ?? null,
        image_url: body.imageUrl || null,
        icon: body.icon ?? "link",
        is_visible: body.isVisible,
      })
      .select("*")
      .single();
    if (error) return apiError("custom_link_failed", error.message, 400);
    await recordEvent({ workspaceId: scope.workspaceId, pageId: body.pageId, eventType: "custom_link.added", metadata: { linkId: data.id } });
    return apiOk({ customLink: data }, { status: 201 });
  }

  if (resource === "gallery") {
    const body = await parseJsonBody(req, linkGallerySchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);

    if (body.id) {
      const { data, error } = await supabase
        .from("photo_gallery_items")
        .update({
          image_url: body.imageUrl,
          alt_text: body.altText ?? null,
          caption: body.caption ?? null,
        })
        .eq("id", body.id)
        .select("*")
        .single();
      if (error) return apiError("gallery_update_failed", error.message, 400);
      return apiOk({ galleryItem: data });
    }

    const { data, error } = await supabase
      .from("photo_gallery_items")
      .insert({
        workspace_id: scope.workspaceId,
        owner_id: scope.ownerId,
        page_id: body.pageId,
        image_url: body.imageUrl,
        alt_text: body.altText ?? null,
        caption: body.caption ?? null,
      })
      .select("*")
      .single();
    if (error) return apiError("gallery_failed", error.message, 400);
    await recordEvent({ workspaceId: scope.workspaceId, pageId: body.pageId, eventType: "gallery.image_added", metadata: { galleryItemId: data.id } });
    return apiOk({ galleryItem: data }, { status: 201 });
  }

  if (resource === "contact") {
    const body = await parseJsonBody(req, linkContactSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);
    const payload = {
      workspace_id: scope.workspaceId,
      owner_id: scope.ownerId,
      page_id: body.pageId,
      email: body.email || null,
      phone: body.phone ?? null,
      website: body.website || null,
      address: body.address ?? null,
      show_email: body.showEmail,
      show_phone: body.showPhone,
      show_website: body.showWebsite,
      show_address: body.showAddress,
    };
    const { data, error } = await supabase.from("contact_information").upsert(payload, { onConflict: "page_id" }).select("*").single();
    if (error) return apiError("contact_failed", error.message, 400);
    return apiOk({ contact: data });
  }

  if (resource === "products") {
    const body = await parseJsonBody(req, linkProductSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);

    if (body.id) {
      // UPDATE EXISTING PRODUCT
      const productId = body.id;

      // 1. Get existing digital product to find offer_id
      const { data: existingProduct, error: fetchErr } = await supabase
        .from("digital_products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (fetchErr || !existingProduct) {
        return apiError("product_not_found", "The digital product could not be found.", 404);
      }

      // 2. Update offer
      if (existingProduct.offer_id) {
        await supabase
          .from("offers")
          .update({
            title: body.title,
            description: body.description,
            price_cents: body.priceCents,
            currency: body.currency,
            show_on_bio: body.showOnBio,
            show_on_shop: body.showOnShop,
            status: body.status,
            config: {
              delivery: body.filePath ? "private_file" : "external_or_manual",
              showOnBio: body.showOnBio,
              showOnShop: body.showOnShop
            }
          })
          .eq("id", existingProduct.offer_id);
      }

      // 3. Update digital product
      const { data: updatedProduct, error: updateErr } = await supabase
        .from("digital_products")
        .update({
          title: body.title,
          slug: slugify(body.title),
          description: body.description ?? null,
          cover_image_url: body.coverImageUrl || null,
          file_path: body.filePath ?? null,
          external_delivery_url: body.externalDeliveryUrl || null,
          price_cents: body.priceCents,
          currency: body.currency,
          status: body.status,
          show_on_bio: body.showOnBio,
          show_on_shop: body.showOnShop,
        })
        .eq("id", productId)
        .select("*")
        .single();

      if (updateErr) return apiError("product_update_failed", updateErr.message, 400);

      // 4. Update page block if it exists, or insert it if showOnBio is now true
      const { data: existingBlock } = await supabase
        .from("creator_page_blocks")
        .select("id")
        .eq("page_id", body.pageId)
        .eq("ref_type", "digital_product")
        .eq("ref_id", productId)
        .maybeSingle();

      if (existingBlock) {
        await supabase
          .from("creator_page_blocks")
          .update({
            title: body.title,
            subtitle: body.description ?? "Digital product",
            description: body.description ?? null,
            image_url: body.coverImageUrl || null,
            status: body.status === "published" ? "live" : "draft",
            is_visible: body.status === "published" && body.showOnBio,
            metadata: { price_cents: body.priceCents, currency: body.currency, product_slug: updatedProduct.slug }
          })
          .eq("id", existingBlock.id);
      } else if (body.showOnBio) {
        await supabase.from("creator_page_blocks").insert({
          workspace_id: scope.workspaceId,
          page_id: body.pageId,
          type: "product",
          title: body.title,
          subtitle: body.description ?? "Digital product",
          description: body.description ?? null,
          image_url: body.coverImageUrl || null,
          status: body.status === "published" ? "live" : "draft",
          is_visible: body.status === "published",
          metadata: { price_cents: body.priceCents, currency: body.currency, product_slug: updatedProduct.slug },
          ref_type: "digital_product",
          ref_id: productId,
        });
      }

      await recordEvent({ workspaceId: scope.workspaceId, pageId: body.pageId, eventType: "product.updated", metadata: { productId } });
      return apiOk({ product: updatedProduct });
    }

    const offer = await createOffer({
      workspaceId: scope.workspaceId,
      pageId: body.pageId,
      ownerId: scope.ownerId,
      type: "product",
      title: body.title,
      description: body.description,
      priceCents: body.priceCents,
      currency: body.currency,
      config: { delivery: body.filePath ? "private_file" : "external_or_manual", showOnBio: body.showOnBio, showOnShop: body.showOnShop },
    });
    if (!offer.ok) return apiError("offer_create_failed", "Could not create the product offer.", 400, offer.error);

    await supabase
      .from("offers")
      .update({ show_on_bio: body.showOnBio, show_on_shop: body.showOnShop, status: body.status })
      .eq("id", offer.data.id);

    const { data, error } = await supabase
      .from("digital_products")
      .insert({
        workspace_id: scope.workspaceId,
        owner_id: scope.ownerId,
        page_id: body.pageId,
        offer_id: offer.data.id,
        title: body.title,
        slug: slugify(body.title),
        description: body.description ?? null,
        cover_image_url: body.coverImageUrl || null,
        file_path: body.filePath ?? null,
        external_delivery_url: body.externalDeliveryUrl || null,
        price_cents: body.priceCents,
        currency: body.currency,
        status: body.status,
        show_on_bio: body.showOnBio,
        show_on_shop: body.showOnShop,
      })
      .select("*")
      .single();
    if (error) return apiError("product_create_failed", error.message, 400);

    if (body.showOnBio) {
      await supabase.from("creator_page_blocks").insert({
        workspace_id: scope.workspaceId,
        page_id: body.pageId,
        type: "product",
        title: body.title,
        subtitle: body.description ?? "Digital product",
        description: body.description ?? null,
        image_url: body.coverImageUrl || null,
        status: body.status === "published" ? "live" : "draft",
        is_visible: body.status === "published",
        metadata: { price_cents: body.priceCents, currency: body.currency, product_slug: data.slug },
        ref_type: "digital_product",
        ref_id: data.id,
      });
    }

    await recordEvent({ workspaceId: scope.workspaceId, pageId: body.pageId, eventType: "product.created", metadata: { productId: data.id } });
    return apiOk({ product: data, offer: offer.data }, { status: 201 });
  }

  if (resource === "affiliate") {
    const body = await parseJsonBody(req, linkAffiliateSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);
    const { data, error } = await supabase
      .from("affiliate_links")
      .insert({
        workspace_id: scope.workspaceId,
        owner_id: scope.ownerId,
        page_id: body.pageId,
        title: body.title,
        destination_url: body.destinationUrl,
        affiliate_code: body.affiliateCode ?? null,
        network: body.network ?? null,
        commission_note: body.commissionNote ?? null,
        show_on_bio: body.showOnBio,
      })
      .select("*")
      .single();
    if (error) return apiError("affiliate_failed", error.message, 400);
    return apiOk({ affiliateLink: data }, { status: 201 });
  }

  if (resource === "referrals") {
    const body = await parseJsonBody(req, linkReferralProgramSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);
    const { data, error } = await supabase
      .from("referral_programs")
      .upsert({
        workspace_id: scope.workspaceId,
        owner_id: scope.ownerId,
        page_id: body.pageId,
        title: body.title,
        description: body.description ?? null,
        reward_type: body.rewardType ?? null,
        reward_value: body.rewardValue ?? null,
        terms: body.terms ?? null,
        status: body.status,
      }, { onConflict: "page_id" })
      .select("*")
      .single();
    if (error) return apiError("referral_failed", error.message, 400);
    return apiOk({ referralProgram: data });
  }

  if (resource === "ai") {
    const body = await parseJsonBody(req, linkAiActionSchema);
    if (isApiResponse(body)) return body;
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);
    const titles: Record<string, string> = {
      generate_bio: "Draft a sharper Smart Link bio",
      improve_bio: "Improve creator bio",
      product_description: "Generate product sales copy",
      pricing_suggestion: "Suggest product pricing",
      product_ideas: "Suggest digital product ideas",
      page_sections: "Suggest page sections",
      improve_cta: "Improve link CTAs",
      affiliate_disclosure: "Generate affiliate disclosure",
      brand_inquiry_copy: "Generate brand inquiry copy",
      seo_metadata: "Generate SEO metadata",
      conversion_review: "Review conversion opportunities",
    };
    const suggestion = await createAiSuggestion({
      workspaceId: scope.workspaceId,
      pageId: body.pageId,
      title: titles[body.action],
      riskLevel: ["pricing_suggestion"].includes(body.action) ? "medium" : "low",
      explanation: `AI generated a structured ${body.action.replace(/_/g, " ")} suggestion for CreatorOS Link Commerce.`,
      patch: {
        targetType: "page",
        targetId: body.pageId,
        operations: [
          { op: "suggest", action: body.action, prompt: body.prompt ?? "", context: body.context },
        ],
      },
    });
    if (!suggestion.ok) return apiError("ai_suggestion_failed", "Could not create AI suggestion.", 400, suggestion.error);
    return apiOk({ suggestion: suggestion.data }, { status: 201 });
  }

  if (resource === "assistant") {
    const body = await req.json();
    if (!body.pageId) {
      return apiError("validation_error", "Missing pageId", 422);
    }
    const scope = await resolveAccountScope(supabase, user.id, body.pageId, body.workspaceId);
    if (!scope) return apiError("forbidden", "This page does not belong to your account.", 403);

    const updatePayload = {
      welcome_message: body.welcomeMessage || "Tell me what you need help with and I will point you to the right offer.",
      system_prompt: body.systemPrompt || "You are a public-facing creator assistant. Recommend published offers only. Do not reveal private dashboard data.",
      status: body.status || "active",
      tone: body.tone || "helpful",
      knowledge_summary: body.knowledgeSummary || "",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("creator_ai_assistants")
      .update(updatePayload)
      .eq("page_id", body.pageId)
      .select("*")
      .single();

    if (error) return apiError("assistant_update_failed", error.message, 400);
    return apiOk({ assistant: data });
  }

  if (resource === "knowledge") {
    const body = await req.json();
    if (!body.title || !body.assistantId) {
      return apiError("validation_error", "Missing title or assistantId", 422);
    }
    const { data: assistant } = await supabase
      .from("creator_ai_assistants")
      .select("workspace_id")
      .eq("id", body.assistantId)
      .maybeSingle();

    if (!assistant) {
      return apiError("forbidden", "AI assistant not found.", 403);
    }

    const payload = {
      workspace_id: assistant.workspace_id,
      assistant_id: body.assistantId,
      source_type: body.sourceType || "manual",
      title: body.title,
      content: body.content || "",
      source_ref: body.sourceRef || "",
      status: body.status || "active",
      updated_at: new Date().toISOString(),
    };

    let result;
    if (body.id) {
      result = await supabase
        .from("assistant_knowledge_sources")
        .update(payload)
        .eq("id", body.id)
        .select("*")
        .single();
    } else {
      result = await supabase
        .from("assistant_knowledge_sources")
        .insert(payload)
        .select("*")
        .single();
    }

    const { data, error } = result;
    if (error) return apiError("knowledge_save_failed", error.message, 400);

    return apiOk({ knowledge: data }, { status: body.id ? 200 : 201 });
  }

  return apiError("unknown_resource", "Unknown Link Commerce resource.", 404);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const supabase = await createSupabaseServerClient();
  const user = await requireAuth();
  if (!user) return apiError("unauthorized", "Sign in to manage CreatorOS Link Commerce.", 401);

  if (resource === "social-links") {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("missing_id", "Missing social link ID.", 400);

    const { error } = await supabase.from("creator_social_links").delete().eq("id", id);
    if (error) return apiError("social_link_delete_failed", error.message, 400);
    return apiOk({ deleted: true });
  }

  if (resource === "products") {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("missing_id", "Missing product ID.", 400);

    // Get the product first to find the offer_id and page_id
    const { data: product, error: fetchErr } = await supabase
      .from("digital_products")
      .select("offer_id, page_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !product) {
      return apiError("product_not_found", "Product not found.", 404);
    }

    // Delete any associated page blocks
    await supabase.from("creator_page_blocks").delete().eq("ref_type", "digital_product").eq("ref_id", id);

    // Delete the product
    const { error: deleteErr } = await supabase.from("digital_products").delete().eq("id", id);
    if (deleteErr) return apiError("product_delete_failed", deleteErr.message, 400);

    // Delete the offer
    if (product.offer_id) {
      await supabase.from("offers").delete().eq("id", product.offer_id);
    }

    return apiOk({ deleted: true });
  }

  if (resource === "custom-links") {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("missing_id", "Missing custom link ID.", 400);

    const { error } = await supabase.from("custom_links").delete().eq("id", id);
    if (error) return apiError("custom_link_delete_failed", error.message, 400);
    return apiOk({ deleted: true });
  }

  if (resource === "gallery") {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("missing_id", "Missing gallery item ID.", 400);

    const { error } = await supabase.from("photo_gallery_items").delete().eq("id", id);
    if (error) return apiError("gallery_delete_failed", error.message, 400);
    return apiOk({ deleted: true });
  }

  if (resource === "knowledge") {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("missing_id", "Missing knowledge ID.", 400);

    const { error } = await supabase.from("assistant_knowledge_sources").delete().eq("id", id);
    if (error) return apiError("knowledge_delete_failed", error.message, 400);
    return apiOk({ deleted: true });
  }

  return apiError("unknown_resource", "Unknown Link Commerce resource.", 404);
}
