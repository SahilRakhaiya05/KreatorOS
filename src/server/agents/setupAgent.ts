import type { AgentResult } from "./types";

export async function runSetupAgent(): Promise<AgentResult> {
  return { status: "draft_ready", assistantMessage: "Workspace, page, and starter offers are ready to draft.", proposedToolCalls: ["create_page", "create_offer_draft"], riskLevel: "medium" };
}
