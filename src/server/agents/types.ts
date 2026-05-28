export type AgentResult = {
  status: "draft_ready" | "needs_approval" | "applied" | "failed";
  assistantMessage: string;
  proposedToolCalls: string[];
  riskLevel: "low" | "medium" | "high";
};
