import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runProductAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "product",
    userMessage: input.userMessage ?? "Draft product structure, lessons, delivery, and access rules.",
    workspaceContext: input.workspaceContext,
  });
}
