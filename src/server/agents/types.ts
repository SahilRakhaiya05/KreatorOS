export type AgentResult = {
  status: "draft_ready" | "needs_approval" | "applied" | "failed";
  assistantMessage: string;
  proposedToolCalls: string[];
  riskLevel: "low" | "medium" | "high";
  suggestionTitle?: string;
  patch?: {
    targetType: "page" | "block" | "offer" | "workflow" | "message";
    operations: Array<Record<string, unknown>>;
  };
};
