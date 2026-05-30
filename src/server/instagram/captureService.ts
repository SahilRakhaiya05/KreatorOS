import { generateObject } from "ai";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { isProviderConfigured, resolveModel } from "@/server/ai/providers";
import type { instagramCaptureSchema } from "@/server/api/schemas";

type InstagramCaptureInput = z.infer<typeof instagramCaptureSchema>;

export type InstagramCaptureRow = {
  id: string;
  owner_id: string;
  workspace_id: string | null;
  platform: string;
  media_type: string;
  status: "pending" | "analyzed" | "failed";
  url: string;
  canonical_url: string;
  shortcode: string | null;
  username: string | null;
  story_id: string | null;
  title: string | null;
  caption: string | null;
  thumbnail_url: string | null;
  media_image_urls: string[];
  media_video_urls: string[];
  raw_text: string | null;
  summary: string | null;
  hook: string | null;
  content_format: string | null;
  sentiment: string | null;
  language: string | null;
  tags: string[];
  topics: string[];
  opportunities: string[];
  analysis: Record<string, unknown>;
  captured_at: string | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
};

const analysisSchema = z.object({
  summary: z.string().min(1).max(500),
  hook: z.string().min(1).max(220),
  contentFormat: z.string().min(1).max(80),
  sentiment: z.enum(["positive", "neutral", "negative", "mixed"]),
  tags: z.array(z.string().min(1).max(32)).max(12).default([]),
  topics: z.array(z.string().min(1).max(48)).max(8).default([]),
  opportunities: z.array(z.string().min(1).max(140)).max(6).default([]),
  saveReason: z.string().min(1).max(220),
  remixIdeas: z.array(z.string().min(1).max(140)).max(5).default([]),
});

function isInstagramUrl(value: string) {
  try {
    const url = new URL(value);
    return /(^|\.)instagram\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function fallbackAnalysis(payload: InstagramCaptureInput) {
  const caption = payload.instagram.caption || payload.raw?.visibleTextSample || payload.page.title || "Instagram item";
  const words = caption
    .toLowerCase()
    .split(/[^a-z0-9#@]+/i)
    .filter((word) => word.length > 3)
    .slice(0, 8);

  return {
    summary: caption.slice(0, 260),
    hook: payload.page.title || caption.slice(0, 160),
    contentFormat: payload.instagram.type || "instagram_page",
    sentiment: "neutral" as const,
    tags: Array.from(new Set(words)).slice(0, 8),
    topics: Array.from(new Set(words)).slice(0, 5),
    opportunities: [
      "Review the hook and first frame before reusing this idea.",
      "Turn the strongest audience pain point into a creator post or offer test.",
    ],
    saveReason: "Saved from Instagram for later review.",
    remixIdeas: ["Rewrite the hook for your niche.", "Extract a short checklist from the caption."],
  };
}

async function analyzeCapture(payload: InstagramCaptureInput) {
  const fallback = fallbackAnalysis(payload);
  if (!isProviderConfigured("google")) return { analysis: fallback, provider: "fallback", available: false };

  try {
    const { object } = await generateObject({
      model: resolveModel("google", "gemini-2.0-flash"),
      schema: analysisSchema,
      temperature: 0.3,
      system: [
        "You analyze Instagram posts and reels for a creator knowledge dashboard.",
        "Extract practical creator strategy, searchable tags, content topics, and remix opportunities.",
        "Do not invent metrics, private data, comments, likes, or transcript details that are not in the payload.",
      ].join(" "),
      prompt: JSON.stringify({
        url: payload.page.canonicalUrl || payload.page.url,
        title: payload.page.title,
        type: payload.instagram.type,
        username: payload.instagram.username,
        caption: payload.instagram.caption,
        visibleTextSample: payload.raw?.visibleTextSample?.slice(0, 6000),
        openGraph: payload.instagram.openGraph,
        twitter: payload.instagram.twitter,
      }),
    });

    return { analysis: object, provider: "google", available: true };
  } catch (error) {
    const warning = error instanceof Error ? error.message : "Gemini analysis failed.";
    return { analysis: { ...fallback, warning }, provider: "fallback", available: false };
  }
}

export function normalizeInstagramCapture(payload: InstagramCaptureInput) {
  const canonicalUrl = payload.page.canonicalUrl || payload.page.url;
  if (!isInstagramUrl(canonicalUrl)) {
    throw new Error("Only Instagram URLs can be imported.");
  }

  return {
    platform: "instagram",
    media_type: payload.instagram.type || "instagram_page",
    url: payload.page.url,
    canonical_url: canonicalUrl,
    shortcode: payload.instagram.shortcode || null,
    username: payload.instagram.username || null,
    story_id: payload.instagram.storyId || null,
    title:
      String(payload.instagram.openGraph.title || payload.instagram.twitter.title || payload.page.title || "").trim() ||
      null,
    caption: payload.instagram.caption || null,
    thumbnail_url: payload.instagram.thumbnailUrl || null,
    media_image_urls: payload.instagram.mediaImageUrls ?? [],
    media_video_urls: payload.instagram.mediaVideoUrls ?? [],
    raw_payload: payload,
    raw_text: payload.raw?.visibleTextSample || null,
    language: payload.page.language || null,
    captured_at: payload.page.capturedAt || new Date().toISOString(),
  };
}

export async function saveInstagramCapture(input: {
  userId: string;
  workspaceId?: string | null;
  payload: InstagramCaptureInput;
}) {
  const supabase = await createSupabaseServerClient();
  const normalized = normalizeInstagramCapture(input.payload);
  const { analysis, provider, available } = await analyzeCapture(input.payload);

  const row = {
    ...normalized,
    owner_id: input.userId,
    workspace_id: input.workspaceId ?? null,
    status: "analyzed",
    summary: analysis.summary,
    hook: analysis.hook,
    content_format: analysis.contentFormat,
    sentiment: analysis.sentiment,
    tags: analysis.tags,
    topics: analysis.topics,
    opportunities: analysis.opportunities,
    analysis: { ...analysis, provider, providerAvailable: available },
    analyzed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("instagram_captures")
    .upsert(row, { onConflict: "owner_id,canonical_url" })
    .select("*")
    .single<InstagramCaptureRow>();

  if (error) return { ok: false as const, error };
  return { ok: true as const, data, provider, available };
}

export async function listInstagramCaptures(input: { userId: string; workspaceId?: string | null }) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("instagram_captures")
    .select("*")
    .eq("owner_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (input.workspaceId) query = query.eq("workspace_id", input.workspaceId);

  const { data, error } = await query.returns<InstagramCaptureRow[]>();
  if (error) return { ok: false as const, error };
  return { ok: true as const, data: data ?? [] };
}
