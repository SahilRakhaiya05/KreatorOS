import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runPricingAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "pricing",
    userMessage: input.userMessage ?? "Review pricing and suggest the best offer strategy.",
    workspaceContext: input.workspaceContext,
  });
}
