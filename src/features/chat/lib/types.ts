import type { ProviderId } from "@/server/ai/providers";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  approvals?: ChatApproval[];
}

export interface ChatApproval {
  id: string;
  title: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending" | "approved" | "applied" | "rejected" | string;
  explanation?: string | null;
  patch?: unknown;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface ProviderCatalogEntry {
  id: ProviderId;
  label: string;
  models: { id: string; label: string }[];
  available: boolean;
}
