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
