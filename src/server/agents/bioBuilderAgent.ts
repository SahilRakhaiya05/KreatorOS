import type { AgentResult } from "./types";
import { runModelAgent } from "./modelRunner";

export async function runBioBuilderAgent(input: { userMessage?: string; workspaceContext?: Record<string, unknown> } = {}): Promise<AgentResult> {
  return runModelAgent({
    kind: "bio_builder",
    userMessage: input.userMessage ?? "Improve the creator profile, page copy, and section structure.",
    workspaceContext: input.workspaceContext,
  });
}
