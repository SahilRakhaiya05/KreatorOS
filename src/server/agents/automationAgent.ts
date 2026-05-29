import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runAutomationAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "automation",
    userMessage: input.userMessage ?? "Draft a workflow automation with safe sequential node execution steps.",
    workspaceContext: input.workspaceContext,
  });
}
