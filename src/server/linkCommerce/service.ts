import { notFound } from "next/navigation";

import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import type { WorkspaceAccessRecord } from "@/server/auth/routeAccess";
import { requireUser } from "@/server/profile/profileService";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createWorkspaceForUser } from "@/server/workspaces/workspaceService";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "creator";
}

async function uniquePageSlug(base: string, userId: string, workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const clean = slugify(base);
  const candidates = [
    clean,
    `${clean}-${userId.slice(0, 6)}`,
    `${clean}-${workspaceId.slice(0, 6)}`,
    `${clean}-${crypto.randomUUID().slice(0, 6)}`,
  ];

  const { data } = await supabase
    .from("creator_pages")
    .select("slug,username")
    .or(candidates.flatMap((candidate) => [`slug.eq.${candidate}`, `username.eq.${candidate}`]).join(","));

  const used = new Set((data ?? []).flatMap((row) => [row.slug, row.username].filter(Boolean)));
  return candidates.find((candidate) => !used.has(candidate)) ?? `${clean}-${crypto.randomUUID().slice(0, 8)}`;
}

export function formatMoney(cents = 0, currency = "usd") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function getCreatorLinkWorkspace() {
  const { user, profile } = await requireUser();
  const supabase = await createSupabaseServerClient();
  const displayName = profile?.full_name || user.email?.split("@")[0] || "Creator";
  const usernameBase = slugify(profile?.full_name || user.email || user.id);
  let workspace = await getActiveWorkspace(user.id);

  if (!workspace) {
    const created = await createWorkspaceForUser({
      userId: user.id,
      name: `${displayName} Workspace`,
      type: "creator",
      avatarUrl: profile?.avatar_url ?? null,
    });

    if (!created.ok) {
      throw new Error(created.error.message);
    }

    workspace = {
      id: created.workspace.id,
      type: created.workspace.type,
      status: created.workspace.status,
      role: "owner",
    } satisfies WorkspaceAccessRecord;
  }

  let { data: page } = await supabase
    .from("creator_pages")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) {
    const uniqueUsername = await uniquePageSlug(usernameBase, user.id, workspace.id);
    const { data: createdPage, error } = await supabase
      .from("creator_pages")
      .insert({
        workspace_id: workspace.id,
        owner_id: user.id,
        slug: uniqueUsername,
        username: uniqueUsername,
        display_name: displayName,
        handle: `@${uniqueUsername}`,
        headline: "Smart Link storefront",
        bio: "",
        avatar_url: profile?.avatar_url ?? null,
        status: "draft",
        is_published: false,
        setup_progress: 12,
        theme: { mode: "dark", accent: "coral", panel: "glass" },
        seo: { title: displayName, description: "Shop products, links, and creator updates." },
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    page = createdPage;
  }

  const [
    socialLinks,
    customLinks,
    gallery,
    contact,
    products,
    offers,
    affiliateLinks,
    referralProgram,
    assistant,
    assistantKnowledge,
    orders,
    analytics,
    shortLinks,
    bookings,
    customers,
    workflowEvents,
  ] = await Promise.all([
    supabase.from("creator_social_links").select("*").eq("page_id", page.id).order("sort_order", { ascending: true }),
    supabase.from("custom_links").select("*").eq("page_id", page.id).order("sort_order", { ascending: true }),
    supabase.from("photo_gallery_items").select("*").eq("page_id", page.id).order("sort_order", { ascending: true }),
    supabase.from("contact_information").select("*").eq("page_id", page.id).maybeSingle(),
    supabase.from("digital_products").select("*").eq("page_id", page.id).order("created_at", { ascending: false }),
    supabase.from("offers").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
    supabase.from("affiliate_links").select("*").eq("page_id", page.id).order("created_at", { ascending: false }),
    supabase.from("referral_programs").select("*").eq("page_id", page.id).maybeSingle(),
    supabase.from("creator_ai_assistants").select("*").eq("page_id", page.id).maybeSingle(),
    supabase.from("assistant_knowledge_sources").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
    supabase.from("orders").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(25),
    supabase.from("analytics_events").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(250),
    supabase.from("short_links").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    supabase.from("workflow_events").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const paidOrders = (orders.data ?? []).filter((order) => order.status === "paid");
  const pendingOrders = (orders.data ?? []).filter((order) => order.status === "pending");
  const revenueCents = paidOrders.reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0);
  const pendingCents = pendingOrders.reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0);

  return {
    workspace,
    page,
    socialLinks: socialLinks.data ?? [],
    customLinks: customLinks.data ?? [],
    gallery: gallery.data ?? [],
    contact: contact.data ?? null,
    products: products.data ?? [],
    offers: offers.data ?? [],
    affiliateLinks: affiliateLinks.data ?? [],
    referralProgram: referralProgram.data ?? null,
    assistant: assistant.data ?? null,
    knowledgeSources: assistantKnowledge.data ?? [],
    orders: orders.data ?? [],
    analyticsEvents: analytics.data ?? [],
    shortLinks: shortLinks.data ?? [],
    bookingsCount: bookings.count ?? 0,
    customersCount: customers.count ?? 0,
    workflowEvents: workflowEvents.data ?? [],
    wallet: {
      revenueCents,
      pendingCents,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      refundsCents: (orders.data ?? [])
        .filter((order) => order.status === "refunded")
        .reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0),
    },
  };
}

export async function getPublicLinkPage(slug: string, linkThemeSlug?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: page } = await supabase
    .from("creator_pages")
    .select("*")
    .or(`slug.eq.${slug},username.eq.${slug}`)
    .or("status.eq.published,is_published.eq.true")
    .maybeSingle();

  if (!page) notFound();

  let shortLinkOverride: any = null;
  if (linkThemeSlug) {
    const { data: sl } = await supabase
      .from("short_links")
      .select("*")
      .eq("slug", linkThemeSlug)
      .eq("workspace_id", page.workspace_id)
      .eq("is_active", true)
      .maybeSingle();

    if (sl && sl.metadata) {
      shortLinkOverride = sl;
      if (sl.metadata.custom_theme) {
        page.theme = sl.metadata.custom_theme;
      }
      if (sl.metadata.displayName) {
        page.display_name = sl.metadata.displayName;
      }
      if (sl.metadata.headline) {
        page.headline = sl.metadata.headline;
      }
      if (sl.metadata.bio) {
        page.bio = sl.metadata.bio;
      }
    }
  }

  const [socialLinks, customLinks, gallery, contact, products, affiliateLinks, referralProgram, assistant, bookings, calendarSlots] = await Promise.all([
    supabase.from("creator_social_links").select("*").eq("page_id", page.id).eq("is_visible", true).order("sort_order", { ascending: true }),
    supabase.from("custom_links").select("*").eq("page_id", page.id).eq("is_visible", true).order("sort_order", { ascending: true }),
    supabase.from("photo_gallery_items").select("*").eq("page_id", page.id).order("sort_order", { ascending: true }),
    supabase.from("contact_information").select("*").eq("page_id", page.id).maybeSingle(),
    supabase
      .from("digital_products")
      .select("*")
      .eq("page_id", page.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase.from("affiliate_links").select("*").eq("page_id", page.id).eq("status", "active").eq("show_on_bio", true),
    supabase.from("referral_programs").select("*").eq("page_id", page.id).eq("status", "active").maybeSingle(),
    supabase.from("creator_ai_assistants").select("*").eq("page_id", page.id).eq("status", "active").maybeSingle(),
    supabase.from("offers").select("*").eq("workspace_id", page.workspace_id).eq("type", "booking").eq("status", "published").order("created_at", { ascending: false }),
    supabase
      .from("creator_calendar_slots")
      .select("*")
      .eq("page_id", page.id)
      .eq("status", "available")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(120),
  ]);

  let finalCustomLinks = customLinks.data ?? [];
  let finalProducts = products.data ?? [];

  if (shortLinkOverride?.metadata?.has_content_override) {
    const campaignLinks = shortLinkOverride.metadata.campaignCustomLinks || {};
    const campaignProds = shortLinkOverride.metadata.campaignProducts || {};
    
    // Filter standard custom links if selectedIds exists
    if (campaignLinks.selectedIds) {
      finalCustomLinks = finalCustomLinks.filter((l: any) => campaignLinks.selectedIds.includes(l.id));
    }
    // Append campaign-only custom links
    if (campaignLinks.customCreated && Array.isArray(campaignLinks.customCreated)) {
      const customCreatedMapped = campaignLinks.customCreated.map((l: any, idx: number) => ({
        id: `campaign-link-${idx}`,
        page_id: page.id,
        title: l.title,
        url: l.url,
        description: l.description || null,
        is_visible: true,
      }));
      finalCustomLinks = [...finalCustomLinks, ...customCreatedMapped];
    }

    // Filter standard products if selectedIds exists
    if (campaignProds.selectedIds) {
      finalProducts = finalProducts.filter((p: any) => campaignProds.selectedIds.includes(p.id));
    }
    // Append campaign-only products
    if (campaignProds.customCreated && Array.isArray(campaignProds.customCreated)) {
      const customCreatedProdsMapped = campaignProds.customCreated.map((p: any, idx: number) => ({
        id: `campaign-prod-${idx}`,
        page_id: page.id,
        title: p.title,
        slug: `campaign-prod-${idx}`,
        description: p.description || null,
        price_cents: Number(p.priceCents || p.price_cents || 0),
        currency: p.currency || "usd",
        status: "published",
        show_on_bio: true,
        show_on_shop: true,
      }));
      finalProducts = [...finalProducts, ...customCreatedProdsMapped];
    }
  }

  return {
    page,
    socialLinks: socialLinks.data ?? [],
    customLinks: finalCustomLinks,
    gallery: gallery.data ?? [],
    contact: contact.data ?? null,
    products: finalProducts,
    affiliateLinks: affiliateLinks.data ?? [],
    referralProgram: referralProgram.data ?? null,
    assistant: assistant.data ?? null,
    bookings: bookings.data ?? [],
    calendarSlots: calendarSlots.data ?? [],
  };
}
