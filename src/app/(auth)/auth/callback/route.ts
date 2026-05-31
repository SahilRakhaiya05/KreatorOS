import { NextResponse } from "next/server";

import { getPostAuthRedirect } from "../../../../server/profile/profileService";
import { createSupabaseServerClient } from "../../../../server/supabase/serverClient";
import { getRequestOrigin } from "@/server/utils/url";

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
          .select("account_type,full_name,onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        return NextResponse.redirect(`${origin}${next ?? getPostAuthRedirect(profile)}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
