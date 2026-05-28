import type { CreatorEvent } from "@/server/events/types";

export type AutomationHandlerResult = {
  status: "queued" | "succeeded" | "failed";
  logs: Array<Record<string, unknown>>;
};

export async function runBuiltInHandlers(event: CreatorEvent): Promise<AutomationHandlerResult> {
  const logs: Array<Record<string, unknown>> = [
    { level: "info", message: "Event received by automation spine.", eventType: event.type },
  ];

  if (event.type.startsWith("payment.")) {
    logs.push({ level: "info", message: "Payment events can unlock access and send notifications when providers are connected." });
  }

  if (event.type.startsWith("ai.suggestion.")) {
    logs.push({ level: "info", message: "AI suggestion event recorded for approval queue." });
  }

  return { status: "succeeded", logs };
}
