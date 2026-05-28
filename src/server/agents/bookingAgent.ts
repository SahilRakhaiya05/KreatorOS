import type { AgentResult } from "./types";

export async function runBookingAgent(): Promise<AgentResult> {
  return { status: "draft_ready", assistantMessage: "Booking flow draft is ready with provider checks.", proposedToolCalls: ["check_availability", "hold_booking"], riskLevel: "medium" };
}
