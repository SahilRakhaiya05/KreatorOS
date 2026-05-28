import type { AgentResult } from "./types";

export async function runPricingAgent(): Promise<AgentResult> {
  return { status: "needs_approval", assistantMessage: "Pricing recommendations are ready and require approval before applying.", proposedToolCalls: ["analyze_offer", "request_approval"], riskLevel: "high" };
}
