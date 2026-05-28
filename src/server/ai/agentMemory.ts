export type AgentMemoryEntry = {
  key: string;
  value: unknown;
  source: "profile" | "page" | "analytics" | "research" | "manual";
};

export function summarizeAgentMemory(entries: AgentMemoryEntry[]) {
  return entries.map((entry) => `${entry.source}:${entry.key}`).join("\n");
}
