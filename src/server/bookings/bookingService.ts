import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { calendarService } from "@/server/calendar/calendarService";
import { notificationService } from "@/server/notifications/notificationService";
import { recordEvent } from "@/server/analytics/recordEvent";
import { emitEvent } from "@/server/events/emitEvent";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

function getServiceClient() {
  return hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient();
}

export const bookingService = {
  async holdSlot(input: {
    workspaceId: string;
    offerId: string;
    startsAt: string;
    timezone?: string;
    customer: {
      email: string;
      name?: string | null;
      phone?: string | null;
    };
  }) {
    const supabase = await getServiceClient();

    // 1. Fetch offer
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", input.offerId)
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();

    if (offerError) return { ok: false as const, error: offerError.message };
    if (!offer) return { ok: false as const, error: "Offer not found or unavailable." };

    const isFree = Number(offer.price_cents ?? 0) === 0;
    const initialStatus = isFree ? "confirmed" : "held";

    // 2. Find and hold the exact public slot. Schedule-slot offers should never create
    // bookings for times that are already booked, held, blocked, or unpublished.
    const { data: matchingSlot } = await supabase
      .from("creator_calendar_slots")
      .select("*")
      .eq("page_id", offer.page_id || "")
      .eq("starts_at", input.startsAt)
      .maybeSingle();

    if (matchingSlot && matchingSlot.status !== "available") {
      return { ok: false as const, error: "This time is no longer available." };
    }

    if (!matchingSlot && (offer.config as any)?.bookingMode === "schedule_slots") {
      return { ok: false as const, error: "This time is not available on the creator calendar." };
    }

    const { data: slot } = matchingSlot
      ? { data: matchingSlot }
      : await supabase
      .from("creator_calendar_slots")
      .select("*")
      .eq("page_id", offer.page_id || "")
      .eq("starts_at", input.startsAt)
      .eq("status", "available")
      .maybeSingle();

    if (slot) {
      const nextSlotStatus = isFree ? "booked" : "held";
      await supabase
        .from("creator_calendar_slots")
        .update({ status: nextSlotStatus })
        .eq("id", slot.id);
    }

    // 3. Find or create customer
    let customerId: string;
    const email = input.customer.email.trim().toLowerCase();
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("email", email)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: createdCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          workspace_id: input.workspaceId,
          email,
          name: input.customer.name || null,
          phone: input.customer.phone || null,
        })
        .select("id")
        .single();

      if (customerError) return { ok: false as const, error: customerError.message };
      customerId = createdCustomer.id;
    }

    // 4. Calculate end time
    const durationMinutes = (offer.config as any)?.durationMinutes || 30;
    const endAt = new Date(new Date(input.startsAt).getTime() + durationMinutes * 60 * 1000).toISOString();

    // 5. Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        workspace_id: input.workspaceId,
        customer_id: customerId,
        offer_id: input.offerId,
        start_at: input.startsAt,
        end_at: endAt,
        timezone: input.timezone || "UTC",
        status: initialStatus,
        metadata: {
          slot_id: slot?.id,
          customer_name: input.customer.name,
          customer_phone: input.customer.phone,
        },
      })
      .select("*")
      .single();

    if (bookingError) return { ok: false as const, error: bookingError.message };

    // 6. Record events & logs
    await recordEvent({
      workspaceId: input.workspaceId,
      eventType: isFree ? "booking.confirmed" : "booking.held",
      metadata: { bookingId: booking.id, offerId: input.offerId },
    });

    await emitEvent({
      type: isFree ? "booking.confirmed" : "booking.held",
      workspaceId: input.workspaceId,
      actorType: "customer",
      payload: { bookingId: booking.id, offerId: input.offerId },
      idempotencyKey: `booking_${initialStatus}:${booking.id}`,
    });

    await writeAuditLog({
      workspaceId: input.workspaceId,
      actorType: "customer",
      action: isFree ? "booking.confirmed" : "booking.held",
      targetType: "booking",
      targetId: booking.id,
      after: booking,
    });

    // 7. If booking is free, trigger full calendar invite and confirmation flows immediately
    if (isFree) {
      const confirmResult = await this.confirmBooking(booking.id);
      if (confirmResult.ok) {
        return { ok: true as const, booking: confirmResult.booking, confirmed: true };
      }
    }

    return { ok: true as const, booking, confirmed: isFree };
  },

  async confirmBooking(bookingId: string, orderId?: string) {
    const supabase = await getServiceClient();

    // 1. Fetch booking & customer details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, customers(*), offers(*)")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) return { ok: false as const, error: bookingError.message };
    if (!booking) return { ok: false as const, error: "Booking not found." };

    if (booking.status === "confirmed") {
      return { ok: true as const, booking };
    }

    // 2. Mark booking as confirmed
    const { data: confirmedBooking } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        metadata: {
          ...((booking.metadata as Record<string, unknown>) || {}),
          order_id: orderId || null,
          confirmed_at: new Date().toISOString(),
        },
      })
      .eq("id", bookingId)
      .select("*, customers(*), offers(*)")
      .single();

    // 3. Mark calendar slot as booked
    const slotId = (booking.metadata as any)?.slot_id;
    if (slotId) {
      await supabase
        .from("creator_calendar_slots")
        .update({ status: "booked" })
        .eq("id", slotId);
    }

    // 4. Create virtual calendar event
    const customerObj = booking.customers as any;
    const offerObj = booking.offers as any;
    
    const calResult = await calendarService.createEvent({
      workspaceId: booking.workspace_id,
      title: `${offerObj?.title || "Booking Session"} - ${customerObj?.name || customerObj?.email}`,
      description: `Virtual meeting for offer: ${offerObj?.title || "Booking Session"}`,
      startTime: booking.start_at,
      endTime: booking.end_at,
      customerEmail: customerObj?.email || "",
      customerName: customerObj?.name || undefined,
      metadata: { bookingId },
    });

    let finalBooking = confirmedBooking;
    if (calResult.ok && calResult.externalEventId) {
      const { data: updatedBooking } = await supabase
        .from("bookings")
        .update({
          meeting_url: calResult.meetingUrl || null,
          provider_event_id: calResult.externalEventId,
        })
        .eq("id", bookingId)
        .select("*, customers(*), offers(*)")
        .single();
      finalBooking = updatedBooking;
    }

    // 5. Send transaction notifications (Email & WhatsApp)
    const formattedDate = new Date(booking.start_at).toLocaleString();
    const meetingLinkText = calResult.meetingUrl ? `\n\nJoin URL: ${calResult.meetingUrl}` : "";
    const notifyBody = `Hi ${customerObj?.name || "there"},\n\nYour session for "${offerObj?.title}" has been successfully booked for ${formattedDate}.${meetingLinkText}\n\nWe look forward to seeing you!`;

    // Dispatch Email Notification
    await notificationService.sendNotification({
      workspaceId: booking.workspace_id,
      channel: "email",
      customerId: customerObj?.id,
      subject: `Confirmed: ${offerObj?.title || "Booking Session"}`,
      body: notifyBody,
      refType: "booking",
      refId: bookingId,
      metadata: {
        eventTitle: offerObj?.title || "Booking Session",
        dateString: formattedDate,
        meetingUrl: calResult.meetingUrl || "",
      },
    });

    // Dispatch WhatsApp Notification (if phone available)
    if (customerObj?.phone) {
      await notificationService.sendNotification({
        workspaceId: booking.workspace_id,
        channel: "whatsapp",
        customerId: customerObj?.id,
        body: `Confirmed: Your session for "${offerObj?.title}" is scheduled on ${formattedDate}. Link: ${calResult.meetingUrl || "Check Email"}`,
        refType: "booking",
        refId: bookingId,
        metadata: { phone: customerObj.phone },
      });
    }

    // 6. Record events & logs
    await recordEvent({
      workspaceId: booking.workspace_id,
      eventType: "booking.confirmed",
      metadata: { bookingId, calResult },
    });

    await emitEvent({
      type: "booking.confirmed",
      workspaceId: booking.workspace_id,
      actorType: "system",
      payload: { bookingId, calResult },
      idempotencyKey: `booking_confirm:${bookingId}`,
    });

    await writeAuditLog({
      workspaceId: booking.workspace_id,
      actorType: "system",
      action: "booking.confirmed",
      targetType: "booking",
      targetId: bookingId,
      after: finalBooking,
    });

    return { ok: true as const, booking: finalBooking };
  },
};
