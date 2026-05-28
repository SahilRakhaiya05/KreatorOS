export type RiskLevel = "low" | "medium" | "high";

export type RiskCheckInput = {
  action: string;
  targetType: string;
  metadata?: Record<string, unknown>;
};

const highRiskActions = new Set([
  "offer.price_changed",
  "offer.published",
  "page.block.deleted",
  "message.send",
  "refund.issue",
  "provider.execute",
]);

export function classifyRisk(input: RiskCheckInput): RiskLevel {
  if (highRiskActions.has(input.action)) return "high";
  if (input.action.includes("publish") || input.action.includes("delete")) return "medium";
  return "low";
}

export function requiresHumanApproval(input: RiskCheckInput) {
  return classifyRisk(input) !== "low";
}
