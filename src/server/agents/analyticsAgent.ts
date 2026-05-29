import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runAnalyticsAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "analytics",
    userMessage: input.userMessage ?? "Summarize analytics and propose the next measured action.",
    workspaceContext: input.workspaceContext,
  });
}
