export type AiProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiProvider = {
  id: string;
  generateStructured<T>(input: {
    messages: AiProviderMessage[];
    schemaName: string;
    fallback: T;
  }): Promise<T>;
};
