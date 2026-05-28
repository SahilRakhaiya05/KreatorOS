import { mockAiProvider } from "./mockProvider";
import type { AiProvider } from "./provider";

export function getOpenAiProvider(): AiProvider {
  if (!process.env.OPENAI_API_KEY) {
    return mockAiProvider;
  }

  return {
    id: "openai",
    async generateStructured({ fallback }) {
      return fallback;
    },
  };
}
