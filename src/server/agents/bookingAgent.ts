import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runBookingAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "booking",
    userMessage: input.userMessage ?? "Design a booking flow with routing, holds, payment, and reminders.",
    workspaceContext: input.workspaceContext,
  });
}
