import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { bookingHoldSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, bookingHoldSchema);
  if (isApiResponse(body)) return body;

  // TODO: check availability, hold slot, create pending booking, create checkout if paid.
  return apiOk({ status: "held", bookingId: "bk_demo", checkoutUrl: "/checkout/demo", input: body });
}
