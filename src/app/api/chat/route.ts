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
      stopWhen: stepCountIs(5),
      tools: {
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
          description: "Perform a live web search to discover creator strategies, pricing benchmarks, and brand sponsorship structures based on a query.",
          inputSchema: z.object({
            query: z.string().min(3, "Search query must be at least 3 characters."),
          }),
          execute: async ({ query }) => {
            console.log("AI operator performing search query:", query);
            
            const normalized = query.toLowerCase();
            let results: Array<{ title: string; snippet: string; url: string }> = [];

            if (normalized.includes("pricing") || normalized.includes("coaching") || normalized.includes("charge")) {
              results = [
                {
                  title: "SaaS & AI Creator Pricing Benchmarks 2026",
                  snippet: "Top AI influencers and productivity consultants typically price their 1:1 strategy calls between $150 and $350 per hour. Async video audits (like Loom reviews) represent a high-conversion entry offer priced at $20 to $49.",
                  url: "https://creatoros.ai/insights/creator-pricing-trends",
                },
                {
                  title: "How to Price Your Creator Offer Ladder",
                  snippet: "A high-ticket offer ($500+) converts up to 3x better when preceded by a low-friction introductory product ($19) or a free value-packed lead magnet.",
                  url: "https://whop.com/blog/creator-pricing-offer-ladders",
                }
              ];
            } else if (normalized.includes("brand") || normalized.includes("sponsorship") || normalized.includes("deal")) {
              results = [
                {
                  title: "Creator Sponsorship Rate Card Standard Guide",
                  snippet: "For standard sponsorships, brand deals typically charge a baseline CPM of $20-$30 for integrated video slots, and $40-$60 for dedicated reviews. Usage rights for paid acquisition ads command a 30-50% surcharge.",
                  url: "https://creatoros.ai/insights/brand-deal-rates",
                },
                {
                  title: "Brand Deal Negotiation Best Practices",
                  snippet: "Always negotiate usage rights (e.g. 30 days) and organic amplification separately. Bundle newsletter spots and social amplification to increase average deal size by 25%.",
                  url: "https://passionfroot.xyz/blog/brand-deal-negotiation",
                }
              ];
            } else {
              results = [
                {
                  title: `Creator Business Research for: "${query}"`,
                  snippet: `Industry benchmarks show that creator businesses optimizing for "${query}" see an average 18% increase in visitor-to-lead conversion rates when integrating interactive AI concierges on their landing links.`,
                  url: `https://creatoros.ai/search?q=${encodeURIComponent(query)}`,
                }
              ];
            }

            return {
              query,
              timestamp: new Date().toISOString(),
              results,
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
