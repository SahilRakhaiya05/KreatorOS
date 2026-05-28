import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { bookingHoldSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, bookingHoldSchema);
  if (isApiResponse(body)) return body;

  // TODO: after the booking lifecycle table lands, hold real slots and emit booking.held.
  return apiError("booking_lifecycle_pending", "Booking records are not enabled yet. Calendar slots are visible, but holds are blocked until booking persistence is connected.", 409, body);
}
