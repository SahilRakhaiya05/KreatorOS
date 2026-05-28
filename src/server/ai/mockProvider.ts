import type { AiProvider } from "./provider";

export const mockAiProvider: AiProvider = {
  id: "mock",
  async generateStructured({ fallback }) {
    return fallback;
  },
};
