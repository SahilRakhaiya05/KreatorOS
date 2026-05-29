import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runOfferAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "offer",
    userMessage: input.userMessage ?? "Draft an offer with pricing, positioning, checkout, and approval steps.",
    workspaceContext: input.workspaceContext,
  });
}
