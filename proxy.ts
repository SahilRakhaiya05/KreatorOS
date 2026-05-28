import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getDashboardForAccountType } from "./src/features/auth/config/accountTypes";
import { authRoutes, isProtectedPath } from "./src/features/auth/config/authRoutes";
import {
  canAccountTypeAccessSurface,
  canWorkspaceAccessSurface,
  getRouteSurface,
  type AccountType,
  type WorkspaceAccessRecord,
} from "./src/server/auth/routeAccess";
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
      .select("account_type,full_name,onboarding_completed,active_workspace_id")
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

    const surface = getRouteSurface(pathname);

    if (surface) {
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("role, workspaces(id, type, status)")
        .eq("user_id", userId)
        .eq("status", "active");

      const workspace = Array.isArray(memberships)
        ? memberships
            .map((membership) => {
              const workspaceRecord = Array.isArray(membership.workspaces)
                ? membership.workspaces[0]
                : membership.workspaces;

              if (!workspaceRecord) return null;

              return {
                id: workspaceRecord.id,
                type: workspaceRecord.type,
                status: workspaceRecord.status,
                role: membership.role,
              } satisfies WorkspaceAccessRecord;
            })
            .find((candidate) => candidate?.id === profile?.active_workspace_id) ??
          memberships
            .map((membership) => {
              const workspaceRecord = Array.isArray(membership.workspaces)
                ? membership.workspaces[0]
                : membership.workspaces;

              if (!workspaceRecord) return null;

              return {
                id: workspaceRecord.id,
                type: workspaceRecord.type,
                status: workspaceRecord.status,
                role: membership.role,
              } satisfies WorkspaceAccessRecord;
            })
            .find(Boolean) ??
          null
        : null;

      const canAccessWithWorkspace = canWorkspaceAccessSurface(workspace, surface);
      const canAccessWithLegacyProfile = canAccountTypeAccessSurface(profile?.account_type as AccountType | null, surface);

      if (!canAccessWithWorkspace && !canAccessWithLegacyProfile) {
        const unauthorizedUrl = request.nextUrl.clone();
        unauthorizedUrl.pathname = "/unauthorized";
        unauthorizedUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(unauthorizedUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
