import { getProviderStatus } from "@/server/providers/status";
import { emailProvider } from "./emailProvider";
import { whatsappProvider } from "./whatsappProvider";
import { mockNotificationProvider } from "./mockNotificationProvider";
import type { NotificationInput, NotificationResult } from "./types";

export const notificationService = {
  async sendNotification(input: NotificationInput): Promise<NotificationResult> {
    const isDev = process.env.NODE_ENV !== "production";

    if (input.channel === "email") {
      const status = await getProviderStatus(input.workspaceId, "email");
      if (status === "connected" || status === "sandbox") {
        return emailProvider.send(input);
      } else if (status === "mock_mode" || isDev) {
        return mockNotificationProvider.send(input);
      }
      return { ok: false, error: "Email provider is not configured for this workspace." };
    }

    if (input.channel === "whatsapp") {
      const status = await getProviderStatus(input.workspaceId, "whatsapp");
      if (status === "connected" || status === "sandbox") {
        return whatsappProvider.send(input);
      } else if (status === "mock_mode" || isDev) {
        return mockNotificationProvider.send(input);
      }
      return { ok: false, error: "WhatsApp provider is not configured for this workspace." };
    }

    // Default to dashboard/mock delivery for SMS and Dashboard notifications
    return mockNotificationProvider.send(input);
  },
};
