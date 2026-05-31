import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { bookingHoldSchema } from "@/server/api/schemas";
import { bookingService } from "@/server/bookings/bookingService";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { user } = await getSession();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || user?.email;

  if (!email) {
    return apiError("unauthorized", "Sign in or provide email query parameter.", 401);
  }

  const supabase = await createSupabaseServerClient();
  
  // Find customer records with this email
  const { data: customers, error: custError } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email.trim().toLowerCase());

  if (custError) {
    return apiError("customers_failed", custError.message, 400);
  }

  if (!customers || customers.length === 0) {
    return apiOk({ bookings: [] });
  }

  const customerIds = customers.map((c) => c.id);

  // Fetch bookings for these customer IDs
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*, offers(*)")
    .in("customer_id", customerIds)
    .order("start_at", { ascending: false });

  if (bookingsError) {
    return apiError("bookings_failed", bookingsError.message, 400);
  }

  return apiOk({ bookings: bookings ?? [] });
}


export async function POST(req: Request) {
  const body = await parseJsonBody(req, bookingHoldSchema);
  if (isApiResponse(body)) return body;

  const workspaceId = (body.workspaceId as string) || (body.creatorId as string);
  const offerId = (body.offerId as string) || (body.eventTypeId as string);
  const startsAt = (body.startsAt as string) || (body.startTime as string);

  if (!workspaceId) {
    return apiError("missing_workspace", "workspaceId or creatorId is required.", 400);
  }
  if (!offerId) {
    return apiError("missing_offer", "offerId or eventTypeId is required.", 400);
  }
  if (!startsAt) {
    return apiError("missing_start_time", "startsAt or startTime is required.", 400);
  }
  if (!body.customer || !body.customer.email) {
    return apiError("missing_customer", "Customer email is required to book a session.", 400);
  }

  const result = await bookingService.holdSlot({
    workspaceId,
    offerId,
    startsAt,
    timezone: body.customer.timezone || "UTC",
    customer: {
      email: body.customer.email,
      name: body.customer.name || null,
      phone: body.customer.phone || null,
    },
  });

  if (!result.ok) {
    return apiError("booking_failed", result.error || "Failed to create booking hold.", 400);
  }

  return apiOk(result);
}
