import type { AgentResult } from "./types";

export async function runOrchestratorAgent(input: { userMessage: string; mode: "draft" | "execute" }): Promise<AgentResult> {
  return {
    status: input.mode === "execute" ? "needs_approval" : "draft_ready",
    assistantMessage: "I prepared a scoped plan and queued high-risk actions for approval.",
    proposedToolCalls: ["create_page_block", "create_offer_draft", "request_approval"],
    riskLevel: "medium",
  };
}
