import type { NotificationProvider, NotificationResult } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export const whatsappProvider: NotificationProvider = {
  async send(input): Promise<NotificationResult> {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const isDev = process.env.NODE_ENV !== "production";

    if (!twilioSid || !twilioAuthToken) {
      if (isDev) {
        console.log(`[Twilio Mock] WhatsApp credentials not configured. Simulated WhatsApp message body: ${input.body}`);
        return { ok: true, providerMessageId: `mock_twilio_${Date.now()}` };
      }
      return { ok: false, error: "Twilio credentials are not configured for WhatsApp." };
    }

    const supabase = await createSupabaseServerClient();
    let recipientPhone = input.metadata?.phone as string | undefined;

    // Resolve customer phone number if needed
    if (!recipientPhone && input.customerId) {
      const { data: customer } = await supabase
        .from("customers")
        .select("metadata")
        .eq("id", input.customerId)
        .maybeSingle();
      recipientPhone = customer?.metadata?.phone as string | undefined;
    }

    if (!recipientPhone) {
      return { ok: false, error: "No recipient phone number found for WhatsApp notification." };
    }

    try {
      const fromPhone = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // Standard Twilio Sandbox
      const formattedTo = recipientPhone.startsWith("whatsapp:") ? recipientPhone : `whatsapp:${recipientPhone}`;

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromPhone,
          To: formattedTo,
          Body: input.body,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `Twilio API Error: ${errText}` };
      }

      const resData = await res.json();
      const providerMessageId = resData.sid;

      const { data: creatorPage } = await supabase
        .from("creator_pages")
        .select("id, owner_id")
        .eq("workspace_id", input.workspaceId)
        .maybeSingle();

      const { data } = await supabase
        .from("notifications")
        .insert({
          workspace_id: input.workspaceId,
          page_id: creatorPage?.id || null,
          owner_id: creatorPage?.owner_id || null,
          customer_id: input.customerId ?? null,
          ref_type: input.refType ?? null,
          ref_id: input.refId ?? null,
          channel: "whatsapp",
          status: "sent",
          subject: null,
          body: input.body,
          template_name: input.templateName ?? null,
          provider: "twilio",
          provider_message_id: providerMessageId,
          sent_at: new Date().toISOString(),
          metadata: { ...input.metadata, to: formattedTo },
        })
        .select("id")
        .single();

      await writeAuditLog({
        workspaceId: input.workspaceId,
        actorType: "system",
        action: "notification.whatsapp_sent",
        targetType: "notification",
        targetId: data?.id,
        after: { providerMessageId, to: formattedTo },
      });

      return {
        ok: true,
        notificationId: data?.id,
        providerMessageId,
      };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to send WhatsApp message via Twilio." };
    }
  },
};
