import { generateObject } from "ai";
import { z } from "zod";
import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { isProviderConfigured, resolveModel } from "@/server/ai/providers";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export const runtime = "nodejs";

const researchRequestSchema = z.object({
  query: z.string().min(3),
  audience: z.string().optional(),
  angle: z.string().optional(),
});

const sourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  sourceType: z.string(),
});

const researchOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  findings: z.array(z.string()).min(3).max(8),
  sourceQueries: z.array(z.string()).min(3).max(8),
  sourceQueue: z.array(sourceSchema).default([]),
  agents: z.array(z.object({
    name: z.string(),
    desk: z.string(),
    task: z.string(),
    status: z.enum(["queued", "reading", "synthesizing", "done"]),
  })).min(4).max(8),
  kanban: z.object({
    collect: z.array(z.string()).default([]),
    read: z.array(z.string()).default([]),
    synthesize: z.array(z.string()).default([]),
    publish: z.array(z.string()).default([]),
  }),
  timeline: z.array(z.object({
    label: z.string(),
    detail: z.string(),
  })).min(4).max(8),
});

type WebSource = z.infer<typeof sourceSchema>;

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function fetchWikipedia(query: string): Promise<WebSource[]> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("srlimit", "4");
  url.searchParams.set("srsearch", query);

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const json = await res.json();
  const rows = Array.isArray(json?.query?.search) ? json.query.search : [];

  return rows.map((row: any) => ({
    title: asString(row.title) || "Wikipedia result",
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(asString(row.title).replaceAll(" ", "_"))}`,
    snippet: asString(row.snippet).replace(/<[^>]+>/g, ""),
    sourceType: "Wikipedia",
  }));
}

async function fetchHackerNews(query: string): Promise<WebSource[]> {
  const url = new URL("https://hn.algolia.com/api/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("tags", "story");
  url.searchParams.set("hitsPerPage", "4");

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const json = await res.json();
  const rows = Array.isArray(json?.hits) ? json.hits : [];

  return rows.map((row: any) => ({
    title: asString(row.title) || "Hacker News discussion",
    url: asString(row.url) || `https://news.ycombinator.com/item?id=${row.objectID}`,
    snippet: `${row.points ?? 0} points, ${row.num_comments ?? 0} comments`,
    sourceType: "Hacker News",
  }));
}

async function fetchDuckDuckGo(query: string): Promise<WebSource[]> {
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_redirect", "1");
  url.searchParams.set("no_html", "1");

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const json = await res.json();
  const related = Array.isArray(json?.RelatedTopics) ? json.RelatedTopics : [];
  const relatedRows = related.flatMap((item: any) => (Array.isArray(item?.Topics) ? item.Topics : [item]));
  const rows = relatedRows
    .filter((item: any) => typeof item?.FirstURL === "string" && typeof item?.Text === "string")
    .slice(0, 5)
    .map((item: any) => ({
      title: asString(item.Text).split(" - ")[0] || "DuckDuckGo source",
      url: asString(item.FirstURL),
      snippet: asString(item.Text),
      sourceType: "DuckDuckGo",
    }));

  if (json?.AbstractURL && json?.AbstractText) {
    rows.unshift({
      title: asString(json.Heading) || "DuckDuckGo instant answer",
      url: asString(json.AbstractURL),
      snippet: asString(json.AbstractText),
      sourceType: "DuckDuckGo",
    });
  }

  return rows;
}

function dedupeSources(sources: WebSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.url || `${source.sourceType}:${source.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackResearch(query: string, sources: WebSource[], audience?: string, angle?: string) {
  const safeSources = sources.slice(0, 8);
  const baseQueries = [
    `${query} market trends`,
    `${query} creator economy examples`,
    `${query} audience pain points`,
    `${query} competitors pricing positioning`,
    `${query} case studies`,
  ];

  return {
    title: `Research Office: ${query}`,
    summary: `KOffice queued a web research pass for ${audience || "creator audiences"}${angle ? ` with a ${angle} angle` : ""}. ${safeSources.length} public source leads were found for review.`,
    findings: [
      "Start by separating verified source notes from hypotheses before using them in creator copy.",
      "Look for repeated audience pain words across discussions, docs, reviews, and competitor pages.",
      "Turn every strong source into one creator action: offer test, content angle, landing page proof, or outreach list.",
      safeSources[0] ? `First source to inspect: ${safeSources[0].title}.` : "No live sources returned, so use the generated query queue first.",
    ],
    sourceQueries: baseQueries,
    sourceQueue: safeSources,
    agents: [
      { name: "Scout", desk: "Source Desk", task: "Collect public web leads", status: "reading" as const },
      { name: "Analyst", desk: "Trend Room", task: "Extract repeated claims and risks", status: "queued" as const },
      { name: "Audience", desk: "Audience Lab", task: "Translate findings into creator pain points", status: "queued" as const },
      { name: "Editor", desk: "Synthesis Room", task: "Package summary and next actions", status: "queued" as const },
    ],
    kanban: {
      collect: baseQueries.slice(0, 3),
      read: safeSources.slice(0, 3).map((source) => source.title),
      synthesize: ["Cluster pain points", "Pull proof and objections"],
      publish: ["Creator brief", "Content angles", "Offer experiments"],
    },
    timeline: [
      { label: "00:00", detail: "Open source queue" },
      { label: "02:00", detail: "Read highest-signal results" },
      { label: "06:00", detail: "Cluster findings" },
      { label: "10:00", detail: "Draft creator actions" },
    ],
  };
}

function buildFinalAnswer(research: z.infer<typeof researchOutputSchema>) {
  return [
    research.summary,
    "",
    "What KOffice found:",
    ...research.findings.map((finding) => `- ${finding}`),
    "",
    "What to do next:",
    ...Object.entries(research.kanban).flatMap(([column, cards]) => cards.map((card) => `- ${column}: ${card}`)),
  ].join("\n");
}

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view KOffice runs.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_koffice_runs")
    .select("id, query, audience, angle, provider, status, active_step, research, source_queue, agents, kanban, timeline, final_answer, error_message, started_at, completed_at, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) return apiError("koffice_runs_failed", error.message, 400);
  return apiOk({ runs: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to run web research.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  let body: z.infer<typeof researchRequestSchema>;
  try {
    body = researchRequestSchema.parse(await req.json());
  } catch (error) {
    return apiError("validation_error", "Research request failed validation.", 422, error);
  }

  const supabase = await createSupabaseServerClient();
  const { data: run, error: createError } = await supabase
    .from("creator_koffice_runs")
    .insert({
      workspace_id: workspace.id,
      owner_id: user.id,
      query: body.query,
      audience: body.audience ?? null,
      angle: body.angle ?? null,
      status: "running",
      provider: "public_sources",
      active_step: 0,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError) return apiError("koffice_run_create_failed", createError.message, 400);

  const settled = await Promise.allSettled([fetchWikipedia(body.query), fetchHackerNews(body.query), fetchDuckDuckGo(body.query)]);
  const sources = dedupeSources(settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []))).slice(0, 12);
  const fallback = fallbackResearch(body.query, sources, body.audience, body.angle);

  if (!isProviderConfigured("google")) {
    const finalAnswer = buildFinalAnswer(fallback);
    const { data: updatedRun, error: updateError } = await supabase
      .from("creator_koffice_runs")
      .update({
        status: "complete",
        active_step: fallback.timeline.length,
        research: fallback,
        source_queue: fallback.sourceQueue,
        agents: fallback.agents.map((agent) => ({ ...agent, status: "done" })),
        kanban: fallback.kanban,
        timeline: fallback.timeline,
        final_answer: finalAnswer,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("workspace_id", workspace.id)
      .select("*")
      .single();

    if (updateError) return apiError("koffice_run_update_failed", updateError.message, 400);
    return apiOk({ run: updatedRun, research: fallback, finalAnswer, provider: "public_sources", available: false });
  }

  try {
    const { object } = await generateObject({
      model: resolveModel("google", "gemini-2.0-flash"),
      schema: researchOutputSchema,
      temperature: 0.35,
      system: [
        "You are KOffice, a creator-focused web research office.",
        "Synthesize only from the provided source leads and cautious general reasoning.",
        "Do not invent precise recent facts or citations not present in sourceQueue.",
        "Return creator-specific findings, source queries, agents, kanban, and timeline.",
      ].join(" "),
      prompt: JSON.stringify({
        workspaceId: workspace.id,
        query: body.query,
        audience: body.audience,
        angle: body.angle,
        sourceQueue: sources,
        fallback,
      }),
    });

    const research = {
      ...object,
      sourceQueue: object.sourceQueue.length ? object.sourceQueue : sources,
    };
    const finalAnswer = buildFinalAnswer(research);
    const { data: updatedRun, error: updateError } = await supabase
      .from("creator_koffice_runs")
      .update({
        status: "complete",
        active_step: research.timeline.length,
        provider: "google",
        research,
        source_queue: research.sourceQueue,
        agents: research.agents.map((agent) => ({ ...agent, status: "done" })),
        kanban: research.kanban,
        timeline: research.timeline,
        final_answer: finalAnswer,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("workspace_id", workspace.id)
      .select("*")
      .single();

    if (updateError) return apiError("koffice_run_update_failed", updateError.message, 400);

    return apiOk({
      run: updatedRun,
      research,
      finalAnswer,
      provider: "google",
      available: true,
    });
  } catch (error) {
    const warning = error instanceof Error ? error.message : "Gemini synthesis failed.";
    const finalAnswer = buildFinalAnswer(fallback);
    const { data: updatedRun, error: updateError } = await supabase
      .from("creator_koffice_runs")
      .update({
        status: "complete",
        active_step: fallback.timeline.length,
        provider: "public_sources",
        research: fallback,
        source_queue: fallback.sourceQueue,
        agents: fallback.agents.map((agent) => ({ ...agent, status: "done" })),
        kanban: fallback.kanban,
        timeline: fallback.timeline,
        final_answer: finalAnswer,
        error_message: warning,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("workspace_id", workspace.id)
      .select("*")
      .single();

    if (updateError) return apiError("koffice_run_update_failed", updateError.message, 400);
    return apiOk({ run: updatedRun, research: fallback, finalAnswer, provider: "public_sources", available: false, warning });
  }
}
