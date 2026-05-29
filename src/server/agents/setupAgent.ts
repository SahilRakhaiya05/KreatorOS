import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runSetupAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "setup",
    userMessage: input.userMessage ?? "Configure workspace and page onboarding.",
    workspaceContext: input.workspaceContext,
  });
}
