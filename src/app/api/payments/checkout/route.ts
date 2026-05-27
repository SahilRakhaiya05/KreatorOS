import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { checkoutSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, checkoutSchema);
  if (isApiResponse(body)) return body;

  // TODO: Stripe Connect checkout session with application fee and transfer_data[destination].
  return apiOk({ status: "checkout_created", url: "https://checkout.stripe.com/demo", input: body });
}
