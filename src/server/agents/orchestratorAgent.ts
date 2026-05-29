import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runOrchestratorAgent(input: {
  userMessage: string;
  mode: "draft" | "execute";
  workspaceContext?: Record<string, unknown>;
}): Promise<AgentResult> {
  return runModelAgent({ kind: "orchestrator", ...input });
}
