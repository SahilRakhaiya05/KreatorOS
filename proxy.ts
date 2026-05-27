import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getDashboardForAccountType } from "./src/features/auth/config/accountTypes";
import { authRoutes, isProtectedPath } from "./src/features/auth/config/authRoutes";
import { hasSupabaseConfig } from "./src/server/supabase/config";

export async function proxy(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = authRoutes.login;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (userId && isProtectedPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type,full_name,onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    const profileIncomplete = !profile?.onboarding_completed || !profile.full_name || !profile.account_type;

    if (profileIncomplete && pathname !== authRoutes.onboarding) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = authRoutes.onboarding;
      onboardingUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(onboardingUrl);
    }

    if (pathname === authRoutes.onboarding && !profileIncomplete) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = getDashboardForAccountType(profile.account_type);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
