import type { AgentResult } from "./types";

export async function runGrowthAgent(): Promise<AgentResult> {
  return { status: "needs_approval", assistantMessage: "Growth experiments are drafted for approval.", proposedToolCalls: ["rewrite_cta", "create_ab_test"], riskLevel: "medium" };
}
