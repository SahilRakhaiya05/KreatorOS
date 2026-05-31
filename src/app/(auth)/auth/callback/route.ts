import { NextResponse } from "next/server";

import { getPostAuthRedirect } from "../../../../server/profile/profileService";
import { createSupabaseServerClient } from "../../../../server/supabase/serverClient";
import { getRequestOrigin } from "@/server/utils/url";
import { sendWelcomeEmail } from "@/server/notifications/welcomeEmail";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : null;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type,full_name,onboarding_completed,preferences")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          const preferences = (profile.preferences as Record<string, any>) || {};
          if (!preferences.welcome_email_sent) {
            const fullName = profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "there";
            // Trigger welcome email sending asynchronously (non-blocking for redirect)
            void sendWelcomeEmail({
              email: user.email || "",
              fullName,
            }).then(async (res) => {
              if (res.ok) {
                await supabase
                  .from("profiles")
                  .update({
                    preferences: {
                      ...preferences,
                      welcome_email_sent: true,
                    },
                  })
                  .eq("id", user.id);
              }
            });
          }
        }

        return NextResponse.redirect(`${origin}${next ?? getPostAuthRedirect(profile)}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
