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

  if (event.type === "lead.captured") {
    logs.push({ level: "info", message: `AI Concierge Lead captured! Dispatching automated onboarding email to ${(event.payload as any)?.email}.` });
    try {
      const { notificationService } = await import("@/server/notifications/notificationService");
      await notificationService.sendNotification({
        workspaceId: event.workspaceId,
        channel: "email",
        customerId: (event.payload as any)?.customerId,
        subject: "Welcome to KreatorOS!",
        body: `Hi ${(event.payload as any)?.name || "there"},\n\nThank you for chatting with my AI Guide on my page! As a special thanks, here is a mock 15% discount coupon code for your next storefront purchase: KREATOR15\n\nExplore my digital products and coaching sessions, and let me know if you have any questions!\n\nBest,\nMarcus Chen`,
        refType: "lead_captured",
      });
      logs.push({ level: "info", message: "Automated onboarding welcome email successfully dispatched." });
    } catch (err: any) {
      logs.push({ level: "error", message: `Failed to dispatch email notification: ${err.message}` });
    }
  }

  if (event.type.startsWith("ai.suggestion.")) {
    logs.push({ level: "info", message: "AI suggestion event recorded for approval queue." });
  }

  return { status: "succeeded", logs };
}
