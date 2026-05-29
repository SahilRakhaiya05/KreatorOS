import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runGrowthAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "growth",
    userMessage: input.userMessage ?? "Draft growth experiments for the creator business.",
    workspaceContext: input.workspaceContext,
  });
}
