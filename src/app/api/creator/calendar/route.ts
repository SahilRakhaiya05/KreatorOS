import { z } from "zod";

import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createOffer } from "@/server/offers/createOffer";
import { publishOffer } from "@/server/offers/publishOffer";
import { updateOffer } from "@/server/offers/updateOffer";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

const calendarSlotSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(["available", "blocked"]),
});

const calendarSaveSchema = z.object({
  pageId: z.string().uuid(),
  offerId: z.string().uuid().optional(),
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(15).max(180),
  priceCents: z.number().int().min(0).default(0),
  currency: z.string().min(3).max(3).default("usd"),
  status: z.enum(["draft", "published"]).default("published"),
  timezone: z.string().min(1),
  activeDays: z.array(z.string()).default([]),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  bufferMinutes: z.number().int().min(0).max(120).default(10),
  slotIntervalMinutes: z.number().int().min(15).max(180).default(30),
  intakeQuestions: z.array(z.string().min(1).max(160)).default([]),
  meetingProvider: z.enum(["google_meet", "zoom", "manual"]).default("google_meet"),
  paymentProvider: z.enum(["stripe", "manual"]).default("stripe"),
  reminderCadence: z.enum(["none", "one_hour", "one_day"]).default("one_day"),
  reschedulePolicy: z.enum(["open", "24h", "manual"]).default("24h"),
  slots: z.array(calendarSlotSchema).max(250).default([]),
});

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage calendar.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const body = await parseJsonBody(req, calendarSaveSchema);
  if (isApiResponse(body)) return body;

  const supabase = await createSupabaseServerClient();
  const { data: page, error: pageError } = await supabase
    .from("creator_pages")
    .select("id, workspace_id, owner_id")
    .eq("id", body.pageId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (pageError) return apiError("page_lookup_failed", pageError.message, 400);
  if (!page) return apiError("page_not_found", "Calendar page was not found.", 404);

  const config = {
    durationMinutes: body.durationMinutes,
    timezone: body.timezone,
    activeDays: body.activeDays,
    startTime: body.startTime,
    endTime: body.endTime,
    bufferMinutes: body.bufferMinutes,
    slotIntervalMinutes: body.slotIntervalMinutes,
    intakeQuestions: body.intakeQuestions,
    meetingProvider: body.meetingProvider,
    paymentProvider: body.paymentProvider,
    reminderCadence: body.reminderCadence,
    reschedulePolicy: body.reschedulePolicy,
    requiresPayment: body.priceCents > 0,
    bookingMode: "schedule_slots",
  };

  let offer: any;
  if (body.offerId) {
    const result = await updateOffer({
      workspaceId: workspace.id,
      offerId: body.offerId,
      actorId: user.id,
      approved: true,
      update: {
        title: body.title,
        description: body.description || null,
        price_cents: body.priceCents,
        currency: body.currency,
        status: body.status,
        config,
        published_at: body.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
    });
    if (!result.ok) return apiError("offer_update_failed", "Could not save booking type.", 400, result);
    offer = result.data;
  } else {
    const result = await createOffer({
      workspaceId: workspace.id,
      pageId: body.pageId,
      ownerId: user.id,
      type: "booking",
      title: body.title,
      description: body.description || null,
      priceCents: body.priceCents,
      currency: body.currency,
      config,
    });
    if (!result.ok) return apiError("offer_create_failed", "Could not create booking type.", 400, result.error);
    offer = result.data;

    if (body.status === "published") {
      const published = await publishOffer({
        workspaceId: workspace.id,
        offerId: offer.id,
        actorId: user.id,
        approved: true,
      });
      if (published.ok) offer = published.data;
    }
  }

  const blockStatus = body.status === "published" ? "live" : "draft";
  const priceLabel = body.priceCents > 0 ? money(body.priceCents, body.currency) : "Free";
  const blockPayload = {
    workspace_id: workspace.id,
    page_id: body.pageId,
    type: "calendar",
    title: body.title,
    subtitle: body.description || `${body.durationMinutes} min · ${priceLabel}`,
    status: blockStatus,
    metadata: {
      duration: `${body.durationMinutes} min`,
      price: priceLabel,
      timezone: body.timezone,
      availability: body.activeDays,
      schedule: config,
      offerId: offer.id,
    },
    ref_type: "offer",
    ref_id: offer.id,
  };

  const { data: existingBlock } = await supabase
    .from("creator_page_blocks")
    .select("id")
    .eq("page_id", body.pageId)
    .eq("ref_type", "offer")
    .eq("ref_id", offer.id)
    .maybeSingle();

  let blockId = existingBlock?.id;
  if (blockId) {
    const { error } = await supabase.from("creator_page_blocks").update(blockPayload).eq("id", blockId);
    if (error) return apiError("calendar_block_update_failed", error.message, 400);
  } else {
    const { count } = await supabase
      .from("creator_page_blocks")
      .select("id", { count: "exact", head: true })
      .eq("page_id", body.pageId);

    const { data: block, error } = await supabase
      .from("creator_page_blocks")
      .insert({ ...blockPayload, sort_order: count ?? 0 })
      .select("id")
      .single();

    if (error) return apiError("calendar_block_create_failed", error.message, 400);
    blockId = block.id;
  }

  if (blockId) {
    await supabase
      .from("creator_calendar_slots")
      .delete()
      .eq("block_id", blockId)
      .in("status", ["available", "blocked"])
      .gte("starts_at", new Date().toISOString());

    if (body.slots.length) {
      const { error } = await supabase.from("creator_calendar_slots").insert(
        body.slots.map((slot) => ({
          workspace_id: workspace.id,
          page_id: body.pageId,
          block_id: blockId,
          starts_at: slot.startsAt,
          ends_at: slot.endsAt,
          timezone: body.timezone,
          status: slot.status,
        }))
      );

      if (error) return apiError("calendar_slots_save_failed", error.message, 400);
    }
  }

  return apiOk({ offer, blockId, slotCount: body.slots.length });
}

export async function DELETE(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage calendar.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const url = new URL(req.url);
  const offerId = url.searchParams.get("offerId");
  const pageId = url.searchParams.get("pageId");

  if (!offerId || !pageId) {
    return apiError("missing_parameters", "offerId and pageId are required.", 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data: page, error: pageError } = await supabase
    .from("creator_pages")
    .select("id, workspace_id")
    .eq("id", pageId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (pageError) return apiError("page_lookup_failed", pageError.message, 400);
  if (!page) return apiError("page_not_found", "Calendar page was not found.", 404);

  // 1. Find the page block associated with this offer
  const { data: block } = await supabase
    .from("creator_page_blocks")
    .select("id")
    .eq("page_id", pageId)
    .eq("ref_type", "offer")
    .eq("ref_id", offerId)
    .maybeSingle();

  if (block) {
    // 2. Delete associated slots
    await supabase
      .from("creator_calendar_slots")
      .delete()
      .eq("block_id", block.id);

    // 3. Delete the page block
    await supabase
      .from("creator_page_blocks")
      .delete()
      .eq("id", block.id);
  }

  // 4. Delete associated digital products (if any)
  await supabase
    .from("digital_products")
    .delete()
    .eq("offer_id", offerId)
    .eq("workspace_id", workspace.id);

  // 5. Delete the offer itself
  const { error: offerError } = await supabase
    .from("offers")
    .delete()
    .eq("id", offerId)
    .eq("workspace_id", workspace.id);

  if (offerError) return apiError("offer_delete_failed", offerError.message, 400);

  return apiOk({ deleted: true });
}

