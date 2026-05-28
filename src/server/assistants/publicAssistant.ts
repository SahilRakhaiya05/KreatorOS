import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { recordEvent } from "@/server/analytics/recordEvent";
import type { AssistantReply, PublicAssistantOffer } from "./types";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";

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

  const { data: page } = await supabase.from("creator_pages").select("slug").eq("id", input.pageId).maybeSingle();
  const pageSlug = page?.slug ?? input.pageId;

  const rankedOffers = ((offers ?? []) as PublicAssistantOffer[])
    .map((offer) => ({ offer, score: scoreOffer(input.message, offer) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.offer);

  const top = rankedOffers[0];
  const message = top
    ? `I would start with ${top.title}. It is ${formatPrice(top)} and matches what you asked for.`
    : "Tell me your goal, budget, and timeline, and I will help you choose the right next step.";

  const reply: AssistantReply = {
    message,
    recommendedOffers: rankedOffers,
    leadCapturePrompt: "Want me to send the best option to your email?",
    nextActions: rankedOffers.map((offer) => ({
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
    metadata: { recommendedOffers: rankedOffers },
  });

  await recordEvent({
    workspaceId: activeWorkspaceId,
    pageId: input.pageId,
    eventType: "assistant.message",
    visitorId: input.visitorId,
    metadata: { sessionId: activeSession.id, recommendedOfferIds: rankedOffers.map((offer) => offer.id) },
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
