import { apiOk } from "@/server/api/responses";

export async function POST(req: Request) {
  // TODO: verify Cal.com webhook, map booking.created/cancelled/rescheduled to workflow_events.
  await req.text();
  return apiOk({ received: true });
}
