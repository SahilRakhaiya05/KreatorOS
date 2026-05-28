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
  const { data, error } = await supabase
    .from("creator_calendar_slots")
    .select("*")
    .eq("block_id", blockId)
    .eq("status", "available")
    .gte("starts_at", start)
    .lte("starts_at", end)
    .order("starts_at", { ascending: true });

  if (error) return apiError("availability_read_failed", error.message, 400);
  return apiOk({ slots: data ?? [] });
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
