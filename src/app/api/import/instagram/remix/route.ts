import { z } from "zod";
import { generateObject } from "ai";

import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { isProviderConfigured, resolveModel } from "@/server/ai/providers";
import { recordEvent } from "@/server/analytics/recordEvent";
import { emitEvent } from "@/server/events/emitEvent";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export const runtime = "nodejs";

const remixRequestSchema = z.object({
  captureId: z.string().uuid(),
});

const remixAiSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(300),
  priceCents: z.number().int().min(0).max(20000).default(4900),
  durationMinutes: z.number().int().min(15).max(120).default(30),
  emailTemplate: z.string().min(1).max(500),
  whatsappTemplate: z.string().min(1).max(300),
});

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, content-type, x-kreatoros-source, x-kreatoros-version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

function withCors<T extends Response>(response: T, req: Request) {
  Object.entries(corsHeaders(req)).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "offer";
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return withCors(apiError("unauthorized", "Sign in to remix swipes.", 401), req);

  const supabase = await createSupabaseServerClient();
  const workspace = await getActiveWorkspace(user.id);
  const workspaceId = workspace?.id ?? null;

  if (!workspaceId) {
    return withCors(apiError("missing_workspace", "No active workspace found.", 400), req);
  }

  const body = await parseJsonBody(req, remixRequestSchema);
  if (isApiResponse(body)) return withCors(body, req);

  const { captureId } = body;

  // 1. Fetch instagram capture save
  const { data: capture, error: fetchErr } = await supabase
    .from("instagram_captures")
    .select("*")
    .eq("id", captureId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (fetchErr || !capture) {
    return withCors(apiError("capture_not_found", "Instagram capture not found.", 404), req);
  }

  // 2. Fetch pageId from active workspace
  const { data: page } = await supabase
    .from("creator_pages")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();

  const pageId = page?.id || null;
  if (!pageId) {
    return withCors(apiError("missing_page", "No active creator page found for workspace.", 400), req);
  }

  // 3. Run AI or fallback to structure the booking offer
  let remixed;
  let providerUsed = "fallback";

  const caption = capture.caption || "";
  const summary = capture.summary || "";
  const username = capture.username || "Creator";

  if (isProviderConfigured("google")) {
    try {
      const { object } = await generateObject({
        model: resolveModel("google", "gemini-2.0-flash"),
        schema: remixAiSchema,
        temperature: 0.7,
        system: [
          "You are CreatorOS AI Remix Agent.",
          "Your goal is to parse a saved Instagram post or reel and brainstorm a compelling 1:1 Booking Session or digital workshop offer.",
          "Recommend a realistic session fee in USD cents (e.g. 2900, 4900, 9900) or 0 for free qualified calls.",
          "Structure premium reminder templates using placeholder variables: {customer_name}, {event_title}, {start_time}, and {meeting_url}.",
        ].join(" "),
        prompt: JSON.stringify({
          reelTitle: capture.title,
          reelCaption: caption,
          reelSummary: summary,
          creatorUsername: username,
        }),
      });
      remixed = object;
      providerUsed = "google";
    } catch (e) {
      console.error("[Gemini Remix Error]", e);
    }
  }

  if (!remixed) {
    const cleanTitle = capture.title || "Consulting Call";
    remixed = {
      title: `1:1 Strategy: ${cleanTitle.replace(/instagram/gi, "").replace(/^\(\d+\)\s*/, "").trim() || "Consultation"}`,
      description: `Deep dive strategy session based on narrative mechanics from @${username}'s swipe saves. We will map your niche pillars, review analytics, and construct your automation flows.`,
      priceCents: 4900,
      durationMinutes: 30,
      emailTemplate: "Hey {customer_name}, look forward to our Strategy session! Call meeting details: {meeting_url}.",
      whatsappTemplate: "Hi {customer_name}! Your slot for {event_title} is locked for {start_time}."
    };
  }

  // 4. Generate unique slug
  const baseSlug = slugify(remixed.title);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

  const config = {
    duration: `${remixed.durationMinutes} min`,
    price: remixed.priceCents > 0 ? `$${remixed.priceCents / 100}` : "Free",
    type: remixed.priceCents > 0 ? "Paid" : "Free",
    zoomConnected: true,
    meetConnected: false,
    emailConfirm: true,
    emailTemplate: remixed.emailTemplate,
    whatsappConfirm: true,
    whatsappTemplate: remixed.whatsappTemplate,
    aiRecapPrompt: `Follow up on narrative analysis for capture: ${capture.title || "Instagram reel"}`,
    rules: remixed.priceCents > 0 
      ? ["Require payment", "Generate Meet link", "Send email reminder"] 
      : ["Route to default calendar", "Send WhatsApp nudge"]
  };

  // 5. Insert Offer into DB
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .insert({
      workspace_id: workspaceId,
      page_id: pageId,
      owner_id: user.id,
      type: "booking",
      title: remixed.title,
      slug,
      description: remixed.description,
      price_cents: remixed.priceCents,
      currency: "usd",
      config,
      status: "published",
    })
    .select("*")
    .single();

  if (offerError) {
    return withCors(apiError("offer_creation_failed", offerError.message, 500), req);
  }

  // 6. Record events & write audit log
  await recordEvent({
    workspaceId,
    eventType: "offer.created",
    metadata: { offerId: offer.id, captureId, providerUsed },
  });

  await emitEvent({
    type: "offer.created",
    workspaceId,
    actorType: "creator",
    payload: { offerId: offer.id, captureId },
    idempotencyKey: `offer_remix:${offer.id}`,
  });

  await writeAuditLog({
    workspaceId,
    actorType: "creator",
    action: "offer.created",
    targetType: "offer",
    targetId: offer.id,
    after: offer,
  });

  return withCors(apiOk({ offer, providerUsed }), req);
}
