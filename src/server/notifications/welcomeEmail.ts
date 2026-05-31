import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

type WelcomeEmailInput = {
  email: string;
  fullName: string;
};

export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const isDev = process.env.NODE_ENV !== "production";

  if (!resendKey) {
    if (isDev) {
      console.log(`[Resend Mock] Welcome email key not found. Simulated welcome email to ${input.email} for ${input.fullName}`);
      return { ok: true, providerMessageId: `mock_resend_welcome_${Date.now()}` };
    }
    return { ok: false, error: "Resend API key is not configured." };
  }

  try {
    const fromEmail = process.env.TRANSACTIONAL_FROM_EMAIL || "KreatorOS <onboarding@resend.dev>";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const emailHtml = buildWelcomeEmailTemplate(input.fullName, siteUrl);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: input.email,
        subject: "Welcome to KreatorOS - Your AI Business Operator is Ready!",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { ok: false, error: `Resend API Error: ${errText}` };
    }

    const resData = await response.json();
    const providerMessageId = resData.id;

    // Log the successful notification in the database if there's a matching profile
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, active_workspace_id")
      .eq("email", input.email)
      .maybeSingle();

    if (profile) {
      const { data: notification } = await supabase
        .from("notifications")
        .insert({
          workspace_id: profile.active_workspace_id || null,
          owner_id: profile.id,
          channel: "email",
          status: "sent",
          subject: "Welcome to KreatorOS",
          body: `Welcome to KreatorOS, ${input.fullName}! Your AI business operator is ready.`,
          template_name: "welcome_email",
          provider: "resend",
          provider_message_id: providerMessageId,
          sent_at: new Date().toISOString(),
          metadata: { to: input.email, welcomeEmail: true },
        })
        .select("id")
        .single();

      if (notification) {
        await writeAuditLog({
          workspaceId: profile.active_workspace_id || undefined,
          ownerId: profile.id,
          actorType: "system",
          action: "notification.welcome_email_sent",
          targetType: "notification",
          targetId: notification.id,
          after: { providerMessageId, to: input.email },
        });
      }
    }

    return {
      ok: true,
      providerMessageId,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to send welcome email via Resend." };
  }
}

function buildWelcomeEmailTemplate(fullName: string, siteUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to KreatorOS</title>
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
          background: linear-gradient(135deg, #8b7cf6, #2dd4bf);
          padding: 48px 24px;
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
        .greeting {
          font-size: 20px;
          font-weight: 750;
          color: #ffffff;
          margin: 0 0 16px 0;
        }
        .intro-text {
          font-size: 15px;
          line-height: 1.6;
          color: #d1d5db;
          margin: 0 0 24px 0;
        }
        .steps-card {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 28px;
        }
        .step-row {
          display: flex;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 14px 0;
        }
        .step-row:first-child {
          padding-top: 0;
        }
        .step-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .step-number {
          background: rgba(139, 124, 246, 0.15);
          color: #8b7cf6;
          font-weight: 700;
          font-size: 13px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 14px;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .step-title {
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }
        .step-desc {
          color: #9ca3af;
          font-size: 13px;
          line-height: 1.4;
          margin: 0;
        }
        .cta-container {
          text-align: center;
          margin: 28px 0 16px 0;
        }
        .cta-button {
          background-color: #8b7cf6;
          color: #ffffff;
          padding: 14px 32px;
          font-weight: 700;
          border-radius: 12px;
          text-decoration: none;
          display: inline-block;
          font-size: 14px;
          box-shadow: 0 4px 14px rgba(139, 124, 246, 0.3);
          transition: all 0.2s;
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
          color: #8b7cf6;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="banner">
          <h1>Welcome to KreatorOS!</h1>
        </div>
        <div class="content">
          <p class="greeting">Hi ${fullName},</p>
          <p class="intro-text">
            Your new AI Business Operator is ready. KreatorOS gives you one clean dashboard to host your public commerce smart links, manage calendar bookings, track brand deals, and coordinate autonomous work tools.
          </p>
          
          <div class="steps-card">
            <div class="step-row">
              <span class="step-number">1</span>
              <div class="step-content">
                <p class="step-title">Creator Storefront</p>
                <p class="step-desc">List your digital products, paid booking sessions, and courses on a beautiful conversion-focused page.</p>
              </div>
            </div>
            <div class="step-row">
              <span class="step-number">2</span>
              <div class="step-content">
                <p class="step-title">Brand Collab Rooms</p>
                <p class="step-desc">Establish secure Stripe-Connect backed brand campaign rooms with qualification chatbots for sponsors.</p>
              </div>
            </div>
            <div class="step-row">
              <span class="step-number">3</span>
              <div class="step-content">
                <p class="step-title">AI Operator</p>
                <p class="step-desc">Use sandboxed environments to automate data retrieval, code edits, and background tasks safely.</p>
              </div>
            </div>
          </div>
          
          <div class="cta-container">
            <a href="${siteUrl}/login" target="_blank" class="cta-button">Enter My Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>Powered by <a href="${siteUrl}">KreatorOS</a></p>
          <p style="margin-top: 8px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
