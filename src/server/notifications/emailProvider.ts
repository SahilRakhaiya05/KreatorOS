import type { NotificationProvider, NotificationResult } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export const emailProvider: NotificationProvider = {
  async send(input): Promise<NotificationResult> {
    const resendKey = process.env.RESEND_API_KEY;
    const isDev = process.env.NODE_ENV !== "production";

    if (!resendKey) {
      if (isDev) {
        // Safe console mock fallback in development
        console.log(`[Resend Mock] Email key not found. Simulated sending email: ${input.subject}`);
        return { ok: true, providerMessageId: `mock_resend_${Date.now()}` };
      }
      return { ok: false, error: "Resend API key is not configured." };
    }

    const supabase = await createSupabaseServerClient();
    let recipientEmail = input.metadata?.to as string | undefined;

    // Resolve customer email if needed
    if (!recipientEmail && input.customerId) {
      const { data: customer } = await supabase
        .from("customers")
        .select("email")
        .eq("id", input.customerId)
        .maybeSingle();
      recipientEmail = customer?.email;
    }

    if (!recipientEmail) {
      return { ok: false, error: "No recipient email address found for notification." };
    }

    try {
      const fromEmail = process.env.TRANSACTIONAL_FROM_EMAIL || "KreatorOS <onboarding@resend.dev>";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: recipientEmail,
          subject: input.subject || "Updates from your Creator",
          html: `<p>${input.body.replace(/\n/g, "<br/>")}</p>`,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { ok: false, error: `Resend API Error: ${errText}` };
      }

      const resData = await response.json();
      const providerMessageId = resData.id;

      // Log successful email record in notifications database
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
          channel: "email",
          status: "sent",
          subject: input.subject ?? null,
          body: input.body,
          template_name: input.templateName ?? null,
          provider: "resend",
          provider_message_id: providerMessageId,
          sent_at: new Date().toISOString(),
          metadata: { ...input.metadata, to: recipientEmail },
        })
        .select("id")
        .single();

      await writeAuditLog({
        workspaceId: input.workspaceId,
        actorType: "system",
        action: "notification.email_sent",
        targetType: "notification",
        targetId: data?.id,
        after: { providerMessageId, to: recipientEmail },
      });

      return {
        ok: true,
        notificationId: data?.id,
        providerMessageId,
      };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to send email via Resend." };
    }
  },
};
