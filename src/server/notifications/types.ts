export type NotificationChannel = "email" | "whatsapp" | "dashboard" | "sms";

export type NotificationInput = {
  workspaceId: string;
  channel: NotificationChannel;
  customerId?: string | null;
  refType?: string;
  refId?: string;
  subject?: string;
  body: string;
  templateName?: string;
  metadata?: Record<string, unknown>;
};

export type NotificationResult = {
  ok: boolean;
  notificationId?: string;
  providerMessageId?: string;
  error?: string;
};

export interface NotificationProvider {
  send(input: NotificationInput): Promise<NotificationResult>;
}
