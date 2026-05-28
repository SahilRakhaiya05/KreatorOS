import type { NotificationProvider, NotificationResult } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export const mockNotificationProvider: NotificationProvider = {
  async send(input): Promise<NotificationResult> {
    const supabase = await createSupabaseServerClient();
    const providerMessageId = `mock_msg_${Math.random().toString(36).substring(2, 11)}`;

    // Try to retrieve creator page associated with this workspace if it exists
    const { data: creatorPage } = await supabase
      .from("creator_pages")
      .select("id, owner_id")
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        workspace_id: input.workspaceId,
        page_id: creatorPage?.id || null,
        owner_id: creatorPage?.owner_id || null,
        customer_id: input.customerId ?? null,
        ref_type: input.refType ?? null,
        ref_id: input.refId ?? null,
        channel: input.channel,
        status: "sent",
        subject: input.subject ?? null,
        body: input.body,
        template_name: input.templateName ?? null,
        provider: "mock",
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString(),
        metadata: input.metadata || {},
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    console.log(
      `[Mock Notification] Sent ${input.channel.toUpperCase()} message via mock provider:\n` +
      `  To Customer: ${input.customerId || "N/A"}\n` +
      `  Subject: ${input.subject || "N/A"}\n` +
      `  Body: ${input.body}\n` +
      `  Message ID: ${providerMessageId}`
    );

    await writeAuditLog({
      workspaceId: input.workspaceId,
      actorType: "system",
      action: `notification.send_mocked`,
      targetType: "notification",
      targetId: data.id,
      after: { channel: input.channel, providerMessageId },
    });

    return {
      ok: true,
      notificationId: data.id,
      providerMessageId,
    };
  },
};
