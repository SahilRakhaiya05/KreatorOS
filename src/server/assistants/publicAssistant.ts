import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { recordEvent } from "@/server/analytics/recordEvent";
import type { AssistantReply, PublicAssistantOffer } from "./types";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { generateObject } from "ai";
import { z } from "zod";
import { isProviderConfigured, resolveModel } from "@/server/ai/providers";

async function getPublicAssistantClient() {
  return hasSupabaseServiceConfig() ? createSupabaseServiceClient() : await createSupabaseServerClient();
}

function scoreOffer(message: string, offer: PublicAssistantOffer) {
  const text = `${offer.title} ${offer.description ?? ""} ${offer.type}`.toLowerCase();
  return message
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
}

function formatPrice(offer: PublicAssistantOffer) {
  if (offer.price_cents <= 0) return "Free";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: offer.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(offer.price_cents / 100);
}

const assistantReplySchema = z.object({
  message: z.string().min(1).max(700),
  recommendedOfferIds: z.array(z.string()).max(3).default([]),
  leadCapturePrompt: z.string().min(1).max(160).optional(),
});

async function buildModelReply(input: {
  visitorMessage: string;
  pageBio?: string | null;
  assistantPrompt?: string | null;
  knowledgeSummary?: string | null;
  offers: PublicAssistantOffer[];
}) {
  if (!isProviderConfigured("google")) return null;

  try {
    const { object } = await generateObject({
      model: resolveModel("google", "gemini-2.0-flash"),
      schema: assistantReplySchema,
      temperature: 0.35,
      system: [
        "You are the public AI guide on a KreatorOS creator page.",
        "Help visitors choose relevant offers, bookings, products, memberships, or next steps.",
        "Do not invent policies, discounts, inventory, or provider actions.",
        "Recommend only offer IDs from the provided catalog.",
      ].join(" "),
      prompt: JSON.stringify({
        visitorMessage: input.visitorMessage,
        pageBio: input.pageBio,
        assistantPrompt: input.assistantPrompt,
        knowledgeSummary: input.knowledgeSummary,
        offers: input.offers.map((offer) => ({
          id: offer.id,
          title: offer.title,
          type: offer.type,
          description: offer.description,
          price: formatPrice(offer),
        })),
      }),
    });
    return object;
  } catch {
    return null;
  }
}

export async function getOrCreatePublicAssistant(pageId: string) {
  const supabase = await getPublicAssistantClient();
  const { data: page } = await supabase.from("creator_pages").select("*").eq("id", pageId).maybeSingle();
  if (!page?.workspace_id) return null;

  const { data: existing } = await supabase
    .from("creator_ai_assistants")
    .select("*")
    .eq("page_id", pageId)
    .maybeSingle();

  if (existing) return existing;

  const { data } = await supabase
    .from("creator_ai_assistants")
    .insert({
      workspace_id: page.workspace_id,
      page_id: pageId,
      name: `${page.display_name} AI guide`,
      status: "active",
      knowledge_summary: page.bio,
    })
    .select("*")
    .single();

  return data;
}

export async function createAssistantSession(input: {
  pageId: string;
  visitorId?: string | null;
}) {
  const assistant = await getOrCreatePublicAssistant(input.pageId);
  if (!assistant) return { ok: false as const, message: "Assistant is not available for this page." };

  const supabase = await getPublicAssistantClient();
  const { data, error } = await supabase
    .from("assistant_chat_sessions")
    .insert({
      workspace_id: assistant.workspace_id,
      page_id: input.pageId,
      assistant_id: assistant.id,
      visitor_id: input.visitorId ?? null,
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, assistant, session: data };
}

export async function replyToPublicAssistant(input: {
  pageId: string;
  sessionId?: string | null;
  visitorId?: string | null;
  message: string;
}): Promise<{ ok: true; sessionId: string; reply: AssistantReply } | { ok: false; message: string }> {
  const sessionResult = input.sessionId
    ? null
    : await createAssistantSession({ pageId: input.pageId, visitorId: input.visitorId });

  if (sessionResult && !sessionResult.ok) return sessionResult;

  const supabase = await getPublicAssistantClient();
  const sessionId = input.sessionId ?? sessionResult?.session.id;
  const assistantId = sessionResult?.assistant.id;
  const workspaceId = sessionResult?.assistant.workspace_id;

  const { data: session } = sessionId
    ? await supabase.from("assistant_chat_sessions").select("*").eq("id", sessionId).maybeSingle()
    : { data: null };

  const activeSession = session ?? sessionResult?.session;
  if (!activeSession) return { ok: false, message: "Assistant session could not be started." };

  const activeWorkspaceId = workspaceId ?? activeSession.workspace_id;
  const activeAssistantId = assistantId ?? activeSession.assistant_id;

  await supabase.from("assistant_chat_messages").insert({
    workspace_id: activeWorkspaceId,
    session_id: activeSession.id,
    assistant_id: activeAssistantId,
    role: "visitor",
    content: input.message,
  });

  const { data: offers } = await supabase
    .from("offers")
    .select("id,workspace_id,page_id,title,type,description,price_cents,currency,slug")
    .eq("page_id", input.pageId)
    .eq("status", "published");

  const [{ data: page }, { data: assistant }] = await Promise.all([
    supabase.from("creator_pages").select("slug,bio").eq("id", input.pageId).maybeSingle(),
    supabase
      .from("creator_ai_assistants")
      .select("system_prompt,knowledge_summary")
      .eq("id", activeAssistantId)
      .maybeSingle(),
  ]);
  const pageSlug = page?.slug ?? input.pageId;

  const offerCatalog = (offers ?? []) as PublicAssistantOffer[];
  const rankedOffers = offerCatalog
    .map((offer) => ({ offer, score: scoreOffer(input.message, offer) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.offer);

  const modelReply = await buildModelReply({
    visitorMessage: input.message,
    pageBio: page?.bio,
    assistantPrompt: assistant?.system_prompt,
    knowledgeSummary: assistant?.knowledge_summary,
    offers: offerCatalog,
  });

  const modelOffers = modelReply
    ? modelReply.recommendedOfferIds
        .map((id) => offerCatalog.find((offer) => offer.id === id))
        .filter((offer): offer is PublicAssistantOffer => Boolean(offer))
    : [];
  const recommendedOffers = modelOffers.length > 0 ? modelOffers : rankedOffers;
  const top = recommendedOffers[0];
  const message =
    modelReply?.message ??
    (top
      ? `I would start with ${top.title}. It is ${formatPrice(top)} and matches what you asked for.`
      : "Tell me your goal, budget, and timeline, and I will help you choose the right next step.");

  const reply: AssistantReply = {
    message,
    recommendedOffers,
    leadCapturePrompt: modelReply?.leadCapturePrompt ?? "Want me to send the best option to your email?",
    nextActions: recommendedOffers.map((offer) => ({
      label: offer.type === "booking" ? `Book ${offer.title}` : `View ${offer.title}`,
      type: offer.type === "booking" ? "booking" : "checkout",
      href: `/u/${pageSlug}?offer=${offer.slug}`,
      offerId: offer.id,
      workspaceId: offer.workspace_id,
    })),
  };

  await supabase.from("assistant_chat_messages").insert({
    workspace_id: activeWorkspaceId,
    session_id: activeSession.id,
    assistant_id: activeAssistantId,
    role: "assistant",
    content: reply.message,
    metadata: { recommendedOffers, generatedBy: modelReply ? "gemini" : "fallback" },
  });

  await recordEvent({
    workspaceId: activeWorkspaceId,
    pageId: input.pageId,
    eventType: "assistant.message",
    visitorId: input.visitorId,
    metadata: { sessionId: activeSession.id, recommendedOfferIds: recommendedOffers.map((offer) => offer.id) },
  });

  return { ok: true, sessionId: activeSession.id, reply };
}

export async function captureAssistantLead(input: {
  pageId: string;
  sessionId?: string | null;
  email: string;
  name?: string | null;
  intent?: string | null;
}) {
  const supabase = await getPublicAssistantClient();
  const { data: page } = await supabase.from("creator_pages").select("workspace_id").eq("id", input.pageId).maybeSingle();
  if (!page?.workspace_id) return { ok: false as const, message: "Page is not configured for leads." };

  const { data, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: page.workspace_id,
      page_id: input.pageId,
      assistant_session_id: input.sessionId ?? null,
      email: input.email,
      name: input.name ?? null,
      intent: input.intent ?? null,
      source: "assistant",
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, lead: data };
}
