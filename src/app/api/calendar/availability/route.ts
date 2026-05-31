import { z } from "zod";

import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

const slotSchema = z.object({
  block_id: z.string().uuid(),
  workspace_id: z.string().uuid().nullable().optional(),
  page_id: z.string().uuid(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  timezone: z.string().min(1),
  status: z.enum(["available", "held", "booked", "blocked"]).default("available"),
});

const availabilityCreateSchema = z.object({
  slots: z.array(slotSchema).min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const blockId = url.searchParams.get("blockId");
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!blockId || !start || !end) {
    return apiError("missing_params", "blockId, start, and end are required.", 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data: slots, error } = await supabase
    .from("creator_calendar_slots")
    .select("*")
    .eq("block_id", blockId)
    .eq("status", "available")
    .gte("starts_at", start)
    .lte("starts_at", end)
    .order("starts_at", { ascending: true });

  if (error) return apiError("availability_read_failed", error.message, 400);
  if (!slots || slots.length === 0) return apiOk({ slots: [] });

  // Dynamically filter out slots that are busy on external connected calendars (e.g. Google Calendar)
  const workspaceId = slots[0].workspace_id;
  if (workspaceId) {
    try {
      const { calendarService } = await import("@/server/calendar/calendarService");
      const busySlots = await calendarService.getAvailability({
        workspaceId,
        startTime: start,
        endTime: end,
      });

      if (busySlots && busySlots.length > 0) {
        const filtered = slots.filter((slot) => {
          const slotStart = new Date(slot.starts_at).getTime();
          const slotEnd = new Date(slot.ends_at).getTime();

          // If slot overlaps with any busy slot, exclude it
          return !busySlots.some((busy) => {
            const busyStart = new Date(busy.start).getTime();
            const busyEnd = new Date(busy.end).getTime();
            return slotStart < busyEnd && slotEnd > busyStart;
          });
        });

        return apiOk({ slots: filtered });
      }
    } catch (err) {
      console.error("Error filtering calendar availability via freebusy:", err);
    }
  }

  return apiOk({ slots: slots });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create availability.", 401);

  const body = await parseJsonBody(req, availabilityCreateSchema);
  if (isApiResponse(body)) return body;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("creator_calendar_slots").insert(body.slots).select("*");

  if (error) return apiError("availability_create_failed", error.message, 400);
  return apiOk({ slots: data ?? [] }, { status: 201 });
}
