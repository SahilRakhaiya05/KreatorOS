import { streamText, type ModelMessage } from "ai";
import { z } from "zod";
import { PROVIDERS, isProviderConfigured, resolveModel, type ProviderId } from "@/server/ai/providers";
import { getAgent } from "@/features/chat/lib/agents";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  model: z.string().optional(),
  agentId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const provider = parsed.provider as ProviderId;
  if (!isProviderConfigured(provider)) {
    return Response.json(
      { error: `${PROVIDERS[provider].label} is unavailable. Add ${PROVIDERS[provider].envKey} to your environment.` },
      { status: 400 }
    );
  }

  const agent = getAgent(parsed.agentId ?? "");
  const messages = parsed.messages as ModelMessage[];

  try {
    const result = streamText({
      model: resolveModel(provider, parsed.model),
      system: agent.systemPrompt,
      messages,
      temperature: 0.6,
    });
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "The model request failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
