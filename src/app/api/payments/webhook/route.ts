import { apiOk } from "@/server/api/responses";

export async function POST(req: Request) {
  // TODO: verify Stripe signature, update order/subscription, unlock access, emit workflow event.
  await req.text();
  return apiOk({ received: true });
}
