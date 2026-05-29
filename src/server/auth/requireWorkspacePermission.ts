import { redirect } from "next/navigation";

import { getSession } from "./getSession";
import { getActiveWorkspace } from "./getActiveWorkspace";
import { canAccountTypeAccessSurface, type WorkspaceAccessRecord } from "./routeAccess";
import type { RouteSurface } from "./permissions";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { getDashboardForAccountType } from "@/features/auth/config/accountTypes";
import type { AccountType } from "@/features/auth/types";

type ProfileAccessRow = {
  account_type: AccountType | null;
  full_name: string | null;
  onboarding_completed: boolean | null;
};

function currentSurfacePath(surface: RouteSurface) {
  return `/${surface}`;
}

function redirectToAccountDashboard(accountType: AccountType, surface: RouteSurface): never {
  const dashboard = getDashboardForAccountType(accountType);
  redirect(dashboard === currentSurfacePath(surface) ? `/unauthorized?next=${currentSurfacePath(surface)}` : dashboard);
}

export async function requireWorkspacePermission(surface: RouteSurface): Promise<WorkspaceAccessRecord | null> {
  const { user } = await getSession();

  if (!user) {
    redirect(`/login?next=/${surface}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type,full_name,onboarding_completed")
    .eq("id", user.id)
    .maybeSingle<ProfileAccessRow>();

  if (!profile?.onboarding_completed || !profile.full_name || !profile.account_type) {
    redirect("/onboarding");
  }

  if (!canAccountTypeAccessSurface(profile.account_type, surface)) {
    redirectToAccountDashboard(profile.account_type, surface);
  }

  return getActiveWorkspace(user.id);
}
