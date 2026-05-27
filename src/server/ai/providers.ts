import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export type ProviderId = "openai" | "anthropic" | "google";

export interface ModelOption {
  id: string;
  label: string;
}

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  envKey: string;
  models: ModelOption[];
  resolve: (modelId: string) => LanguageModel;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    models: [
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
    ],
    resolve: (modelId) => anthropic(modelId),
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4.1", label: "GPT-4.1" },
    ],
    resolve: (modelId) => openai(modelId),
  },
  google: {
    id: "google",
    label: "Google Gemini",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
    resolve: (modelId) => google(modelId),
  },
};

export const PROVIDER_ORDER: ProviderId[] = ["anthropic", "openai", "google"];

export function isProviderConfigured(id: ProviderId): boolean {
  return Boolean(process.env[PROVIDERS[id].envKey]);
}

export function resolveModel(providerId: ProviderId, modelId?: string): LanguageModel {
  const provider = PROVIDERS[providerId];
  const model = provider.models.find((m) => m.id === modelId) ?? provider.models[0];
  return provider.resolve(model.id);
}

/** Public, client-safe catalog (no secrets) with availability flags. */
export function providerCatalog() {
  return PROVIDER_ORDER.map((id) => ({
    id,
    label: PROVIDERS[id].label,
    models: PROVIDERS[id].models,
    available: isProviderConfigured(id),
  }));
}
