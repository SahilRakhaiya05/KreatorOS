import type { AgentResult } from "./types";

export async function runOfferAgent(): Promise<AgentResult> {
  return { status: "needs_approval", assistantMessage: "Offer drafts are prepared. Publishing and pricing changes need approval.", proposedToolCalls: ["create_offer_draft", "request_approval"], riskLevel: "high" };
}
