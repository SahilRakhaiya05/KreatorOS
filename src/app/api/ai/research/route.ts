import { generateObject } from "ai";
import { z } from "zod";
import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { isProviderConfigured, resolveModel } from "@/server/ai/providers";

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

  const settled = await Promise.allSettled([fetchWikipedia(body.query), fetchHackerNews(body.query)]);
  const sources = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const fallback = fallbackResearch(body.query, sources, body.audience, body.angle);

  if (!isProviderConfigured("google")) {
    return apiOk({ research: fallback, provider: "public_sources", available: false });
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

    return apiOk({
      research: {
        ...object,
        sourceQueue: object.sourceQueue.length ? object.sourceQueue : sources,
      },
      provider: "google",
      available: true,
    });
  } catch (error) {
    const warning = error instanceof Error ? error.message : "Gemini synthesis failed.";
    return apiOk({ research: fallback, provider: "public_sources", available: false, warning });
  }
}
