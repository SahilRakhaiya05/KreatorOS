import { streamText, type ModelMessage, tool, stepCountIs } from "ai";
import { z } from "zod";
import { PROVIDERS, isProviderConfigured, resolveModel, type ProviderId } from "@/server/ai/providers";
import { getAgent } from "@/features/chat/lib/agents";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  model: z.string().optional(),
  agentId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { user } = await getSession();
  if (!user) {
    return Response.json({ error: "Unauthorized. Sign in to chat with agents." }, { status: 401 });
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    return Response.json({ error: "No active workspace found." }, { status: 400 });
  }

  const provider = parsed.provider as ProviderId;
  if (!isProviderConfigured(provider)) {
    return Response.json(
      { error: `${PROVIDERS[provider].label} isn't available right now. Try another model.` },
      { status: 400 }
    );
  }

  const agent = getAgent(parsed.agentId ?? "");
  const messages = parsed.messages as ModelMessage[];

  try {
    const result = streamText({
      model: resolveModel(provider, parsed.model),
      system: agent.systemPrompt,
      messages,
      temperature: 0.6,
      stopWhen: stepCountIs(8),
      tools: {
        read_workspace_context: tool({
          description: "Read the creator workspace context before planning or proposing changes. Includes creator page, smart-link blocks, offers, analytics, and pending approvals.",
          inputSchema: z.object({}),
          execute: async () => {
            const supabase = await createSupabaseServerClient();
            const { data: page } = await supabase
              .from("creator_pages")
              .select("id, display_name, username, slug, headline, bio, theme_name, layout, status, is_published, setup_progress")
              .eq("workspace_id", workspace.id)
              .maybeSingle();

            const [
              { data: blocks },
              { data: customLinks },
              { data: offers },
              { data: products },
              { count: pendingApprovals },
              { count: pageViews },
            ] = await Promise.all([
              page?.id
                ? supabase
                    .from("creator_page_blocks")
                    .select("id, type, title, subtitle, description, url, target_url, status, is_visible, sort_order, clicks, metadata")
                    .eq("page_id", page.id)
                    .order("sort_order", { ascending: true })
                : Promise.resolve({ data: [] }),
              page?.id
                ? supabase
                    .from("custom_links")
                    .select("id, title, url, description, icon, is_visible, sort_order, metadata")
                    .eq("page_id", page.id)
                    .order("sort_order", { ascending: true })
                : Promise.resolve({ data: [] }),
              supabase
                .from("offers")
                .select("id, title, type, price_cents, status, slug, show_on_bio, show_on_shop")
                .eq("workspace_id", workspace.id)
                .order("created_at", { ascending: false })
                .limit(20),
              page?.id
                ? supabase
                    .from("digital_products")
                    .select("id, title, status, price_cents, slug")
                    .eq("page_id", page.id)
                    .order("created_at", { ascending: false })
                    .limit(20)
                : Promise.resolve({ data: [] }),
              supabase
                .from("ai_suggestions")
                .select("id", { count: "exact", head: true })
                .eq("workspace_id", workspace.id)
                .eq("status", "pending"),
              supabase
                .from("analytics_events")
                .select("id", { count: "exact", head: true })
                .eq("workspace_id", workspace.id)
                .eq("event_type", "page.view"),
            ]);

            return {
              workspace: { id: workspace.id, type: workspace.type, role: workspace.role },
              page,
              smartLinkBlocks: blocks ?? [],
              customLinks: customLinks ?? [],
              offers: offers ?? [],
              products: products ?? [],
              pendingApprovals: pendingApprovals ?? 0,
              analytics: { pageViews: pageViews ?? 0 },
            };
          },
        }),
        list_workspace_offers: tool({
          description: "List all active and draft offers (coaching bookings, digital products, memberships, courses) in the current workspace.",
          inputSchema: z.object({}),
          execute: async () => {
            const supabase = await createSupabaseServerClient();
            const { data, error } = await supabase
              .from("offers")
              .select("id, title, type, price_cents, status, slug")
              .eq("workspace_id", workspace.id);
            if (error) return { error: error.message };
            return { offers: data || [] };
          },
        }),
        get_analytics_summary: tool({
          description: "Get the workspace analytics summary (total revenue, customer counts, page views, and brand pipeline).",
          inputSchema: z.object({}),
          execute: async () => {
            const supabase = await createSupabaseServerClient();
            
            // Revenue from paid orders
            const { data: paidOrders } = await supabase
              .from("orders")
              .select("amount_cents")
              .eq("workspace_id", workspace.id)
              .eq("status", "paid");
            const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + o.amount_cents, 0) / 100;

            // Customer count
            const { count: customerCount } = await supabase
              .from("customers")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspace.id);

            // Page views
            const { count: pageViews } = await supabase
              .from("analytics_events")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspace.id)
              .eq("event_type", "page.view");

            // Brand campaign pipeline budget
            const { data: campaigns } = await supabase
              .from("brand_campaigns")
              .select("budget_cents")
              .eq("brand_workspace_id", workspace.id);
            const brandPipeline = (campaigns || []).reduce((sum, c) => sum + (c.budget_cents || 0), 0) / 100;

            return {
              totalRevenue,
              customerCount: customerCount || 0,
              pageViews: pageViews || 0,
              brandPipeline,
            };
          },
        }),
        propose_offer_creation: tool({
          description: "Propose creating a new offer (product, booking, membership, course) for the creator's page. This will queue it in the dashboard approval queue.",
          inputSchema: z.object({
            type: z.enum(["product", "booking", "membership", "course", "service", "lead_magnet"]),
            title: z.string(),
            priceCents: z.number().int().min(0),
            description: z.string().optional(),
            slug: z.string().optional(),
            config: z.record(z.string(), z.any()).optional(),
          }),
          execute: async ({ type, title, priceCents, description, slug, config }) => {
            const supabase = await createSupabaseServerClient();
            
            const { data: page } = await supabase
              .from("creator_pages")
              .select("id")
              .eq("workspace_id", workspace.id)
              .maybeSingle();

            const offerSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            
            const { data: suggestion, error } = await supabase
              .from("ai_suggestions")
              .insert({
                workspace_id: workspace.id,
                page_id: page?.id || null,
                title: `Create ${type} offer: "${title}"`,
                risk_level: priceCents > 10000 ? "high" : "medium",
                explanation: `Creator asked to create a ${type} offer priced at $${priceCents / 100} named "${title}".`,
                patch: {
                  targetType: "offer",
                  operations: [
                    {
                      op: "create_offer",
                      type,
                      title,
                      priceCents,
                      description,
                      slug: offerSlug,
                      config: config || {},
                    }
                  ]
                },
                created_by_type: "agent",
              })
              .select("id, title, risk_level")
              .single();

            if (error) return { error: error.message };
            return {
              status: "queued_for_approval",
              suggestionId: suggestion.id,
              message: `The proposed offer "${title}" has been successfully queued for approval (ID: ${suggestion.id}, risk: ${suggestion.risk_level}). The creator must approve it in their agents dashboard before it goes live.`
            };
          },
        }),
        propose_offer_change: tool({
          description: "Propose editing, pausing, publishing, archiving, or deleting an existing offer. Use this when the creator asks to change a product, booking, membership, course, service, price, visibility, or store placement. The change is queued for approval before applying.",
          inputSchema: z.object({
            offerId: z.string(),
            action: z.enum(["update", "delete"]),
            title: z.string().optional(),
            description: z.string().optional(),
            priceCents: z.number().int().min(0).optional(),
            currency: z.string().min(3).max(3).optional(),
            status: z.enum(["draft", "published", "paused", "archived"]).optional(),
            showOnBio: z.boolean().optional(),
            showOnShop: z.boolean().optional(),
            config: z.record(z.string(), z.any()).optional(),
          }),
          execute: async ({ offerId, action, title, description, priceCents, currency, status, showOnBio, showOnShop, config }) => {
            const supabase = await createSupabaseServerClient();
            const { data: offer } = await supabase
              .from("offers")
              .select("id,title,page_id")
              .eq("id", offerId)
              .eq("workspace_id", workspace.id)
              .maybeSingle();

            if (!offer) return { error: "Offer not found in this workspace." };

            const update = {
              ...(title ? { title } : {}),
              ...(description ? { description } : {}),
              ...(typeof priceCents === "number" ? { price_cents: priceCents } : {}),
              ...(currency ? { currency } : {}),
              ...(status ? { status } : {}),
              ...(typeof showOnBio === "boolean" ? { show_on_bio: showOnBio } : {}),
              ...(typeof showOnShop === "boolean" ? { show_on_shop: showOnShop } : {}),
              ...(config ? { config } : {}),
            };

            const { data: suggestion, error } = await supabase
              .from("ai_suggestions")
              .insert({
                workspace_id: workspace.id,
                page_id: offer.page_id,
                title: action === "delete" ? `Delete offer: "${offer.title}"` : `Update offer: "${title ?? offer.title}"`,
                risk_level: action === "delete" || typeof priceCents === "number" ? "high" : "medium",
                explanation:
                  action === "delete"
                    ? `Creator asked the operator to delete "${offer.title}".`
                    : `Creator asked the operator to update "${offer.title}".`,
                patch: {
                  targetType: "offer",
                  targetId: offerId,
                  operations: [
                    action === "delete"
                      ? { op: "delete_offer", offerId }
                      : { op: "update_offer", offerId, update },
                  ],
                },
                created_by_type: "agent",
              })
              .select("id, title, risk_level")
              .single();

            if (error) return { error: error.message };
            return {
              status: "queued_for_approval",
              suggestionId: suggestion.id,
              message: `Offer change is queued for approval (ID: ${suggestion.id}, risk: ${suggestion.risk_level}).`,
            };
          },
        }),
        propose_smart_link_update: tool({
          description: "Propose updating the creator smart link / public page. Use this to add, update, or delete a visible custom link; add a page block; improve copy; route visitors to an offer; or change visibility. The change is queued for creator approval before it goes live.",
          inputSchema: z.object({
            blockId: z.string().optional(),
            customLinkId: z.string().optional(),
            action: z.enum(["create", "update", "delete"]).default("create"),
            blockType: z.enum(["link", "calendar", "product", "membership", "lead_magnet", "brand_intake", "ai_concierge"]).optional(),
            title: z.string(),
            subtitle: z.string().optional(),
            description: z.string().optional(),
            url: z.string().optional(),
            targetUrl: z.string().optional(),
            status: z.enum(["live", "draft"]).optional(),
            isVisible: z.boolean().optional(),
            metadata: z.record(z.string(), z.any()).optional(),
          }),
          execute: async ({ blockId, customLinkId, action, blockType, title, subtitle, description, url, targetUrl, status, isVisible, metadata }) => {
            const supabase = await createSupabaseServerClient();
            const { data: page } = await supabase
              .from("creator_pages")
              .select("id")
              .eq("workspace_id", workspace.id)
              .maybeSingle();

            if (!page?.id) return { error: "No creator page found for this workspace." };

            const customLinkUpdate = {
              title,
              ...(url || targetUrl ? { url: url ?? targetUrl } : {}),
              ...(description || subtitle ? { description: description ?? subtitle } : {}),
              ...(typeof isVisible === "boolean" ? { is_visible: isVisible } : {}),
              ...(metadata ? { metadata } : {}),
            };
            const customLinkOp = customLinkId
              ? action === "delete"
                ? { op: "delete_custom_link", customLinkId }
                : { op: "update_custom_link", customLinkId, update: customLinkUpdate }
              : {
                  op: "create_custom_link",
                  title,
                  url: url ?? targetUrl ?? "/",
                  description: description ?? subtitle,
                  is_visible: isVisible,
                  metadata,
                };

            const op = blockId ? "update_block" : "create_block";
            const update = {
              title,
              ...(subtitle ? { subtitle } : {}),
              ...(description ? { description } : {}),
              ...(url ? { url } : {}),
              ...(targetUrl ? { target_url: targetUrl } : {}),
              ...(status ? { status } : {}),
              ...(typeof isVisible === "boolean" ? { is_visible: isVisible } : {}),
              ...(metadata ? { metadata } : {}),
            };

            const { data: suggestion, error } = await supabase
              .from("ai_suggestions")
              .insert({
                workspace_id: workspace.id,
                page_id: page.id,
                title: blockId ? `Update smart-link block: "${title}"` : `Add smart-link block: "${title}"`,
                risk_level: action === "delete" ? "high" : "medium",
                explanation: `Creator asked the operator to ${action} smart-link item "${title}".`,
                patch: {
                  targetType: "page",
                  operations: [
                    customLinkId || (!blockId && blockType === "link")
                      ? customLinkOp
                      : blockId
                      ? { op, pageId: page.id, blockId, update }
                      : {
                          op,
                          pageId: page.id,
                          blockType: blockType ?? "link",
                          title,
                          subtitle,
                          description,
                          url,
                          target_url: targetUrl,
                          status,
                          is_visible: isVisible,
                          metadata,
                        },
                  ],
                },
                created_by_type: "agent",
              })
              .select("id, title, risk_level")
              .single();

            if (error) return { error: error.message };
            return {
              status: "queued_for_approval",
              suggestionId: suggestion.id,
              message: `Smart-link change "${title}" is queued for approval (ID: ${suggestion.id}).`,
            };
          },
        }),
        propose_block_edit: tool({
          description: "Propose modifying the creator's page blocks (e.g. adding, updating, or deleting a block). This will queue it in the dashboard approval queue.",
          inputSchema: z.object({
            op: z.enum(["update_page", "update_block", "create_block", "delete_block"]),
            pageId: z.string().optional(),
            blockId: z.string().optional(),
            update: z.record(z.string(), z.any()).optional(),
            title: z.string().optional(),
          }),
          execute: async ({ op, pageId, blockId, update, title }) => {
            const supabase = await createSupabaseServerClient();
            
            let targetPageId = pageId;
            if (!targetPageId) {
              const { data: page } = await supabase
                .from("creator_pages")
                .select("id")
                .eq("workspace_id", workspace.id)
                .maybeSingle();
              targetPageId = page?.id;
            }

            const { data: suggestion, error } = await supabase
              .from("ai_suggestions")
              .insert({
                workspace_id: workspace.id,
                page_id: targetPageId || null,
                title: title || `Propose block operation: ${op}`,
                risk_level: op === "delete_block" ? "high" : "medium",
                explanation: `Proposed block operation: ${op} for block ${blockId || "new"}.`,
                patch: {
                  targetType: "page",
                  operations: [
                    {
                      op,
                      pageId: targetPageId,
                      blockId,
                      update,
                    }
                  ]
                },
                created_by_type: "agent",
              })
              .select("id, title, risk_level")
              .single();

            if (error) return { error: error.message };
            return {
              status: "queued_for_approval",
              suggestionId: suggestion.id,
              message: `Block operation "${op}" has been successfully queued for approval (ID: ${suggestion.id}).`
            };
          },
        }),
        web_search_lookup: tool({
          description: "Perform a live web lookup for current creator strategies, pricing benchmarks, and brand sponsorship structures based on a query. Never invent sources.",
          inputSchema: z.object({
            query: z.string().min(3, "Search query must be at least 3 characters."),
          }),
          execute: async ({ query }) => {
            const url = new URL("https://api.duckduckgo.com/");
            url.searchParams.set("q", query);
            url.searchParams.set("format", "json");
            url.searchParams.set("no_redirect", "1");
            url.searchParams.set("no_html", "1");

            const response = await fetch(url, {
              headers: { Accept: "application/json" },
              next: { revalidate: 900 },
            });

            if (!response.ok) {
              return { query, results: [], error: `Search failed with status ${response.status}.` };
            }

            const data = await response.json();
            const related = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
            const results = related
              .flatMap((item: any) => Array.isArray(item.Topics) ? item.Topics : [item])
              .filter((item: any) => typeof item.Text === "string" && typeof item.FirstURL === "string")
              .slice(0, 5)
              .map((item: any) => ({
                title: item.Text.split(" - ")[0] || item.FirstURL,
                snippet: item.Text,
                url: item.FirstURL,
              }));

            if (data.AbstractText && data.AbstractURL) {
              results.unshift({
                title: data.Heading || query,
                snippet: data.AbstractText,
                url: data.AbstractURL,
              });
            }

            return {
              query,
              timestamp: new Date().toISOString(),
              results,
              note: results.length ? "Use these sources carefully and cite URLs." : "No direct web results returned; say that search did not find sources.",
            };
          },
        }),
      },
    });
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "The model request failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
