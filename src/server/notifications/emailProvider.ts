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
      
      const eventTitle = (input.metadata?.eventTitle as string) || input.subject || "Booking Session";
      const dateString = (input.metadata?.dateString as string) || new Date().toLocaleString();
      const meetingUrl = (input.metadata?.meetingUrl as string) || "";
      
      const emailHtml = buildEmailTemplate(eventTitle, dateString, meetingUrl, input.body);

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
          html: emailHtml,
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

function buildEmailTemplate(title: string, dateStr: string, meetingUrl: string, bodyText: string) {
  const joinButton = meetingUrl 
    ? `<div style="margin: 24px 0 16px 0;">
        <a href="${meetingUrl}" target="_blank" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; font-weight: bold; border-radius: 12px; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: all 0.2s;">Join Meeting</a>
       </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #030408;
          color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 580px;
          margin: 40px auto;
          background-color: #0b0d19;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .banner {
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          padding: 40px 24px;
          text-align: center;
        }
        .banner h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
          text-align: left;
        }
        .intro-text {
          font-size: 16px;
          line-height: 1.6;
          color: #d1d5db;
          margin: 0 0 24px 0;
        }
        .details-card {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 10px 0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #9ca3af;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .detail-value {
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
        }
        .footer {
          background-color: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 24px;
          text-align: center;
        }
        .footer p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }
        .footer a {
          color: #4f46e5;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="banner">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p class="intro-text">${bodyText.replace(/\\n/g, "<br/>")}</p>
          
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Session Type</span>
              <span class="detail-value">${title}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scheduled Date</span>
              <span class="detail-value">${dateStr}</span>
            </div>
            ${meetingUrl ? `
            <div class="detail-row">
              <span class="detail-label">Meeting URL</span>
              <span class="detail-value"><a href="${meetingUrl}" style="color: #10b981; text-decoration: none; font-weight: bold;">Google Meet</a></span>
            </div>
            ` : ""}
          </div>
          
          ${joinButton}
        </div>
        <div class="footer">
          <p>Powered by <a href="#">CreatorOS Smart Link</a></p>
          <p style="margin-top: 8px;">You received this transactional receipt because you booked an appointment.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
