import type { AgentResult } from "./types";

export async function runProductAgent(): Promise<AgentResult> {
  return { status: "draft_ready", assistantMessage: "Product structure and fulfillment draft are ready.", proposedToolCalls: ["create_product_offer", "create_access_rule"], riskLevel: "medium" };
}
