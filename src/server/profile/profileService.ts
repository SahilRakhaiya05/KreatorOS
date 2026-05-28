import { redirect } from "next/navigation";

import { getDashboardForAccountType } from "../../features/auth/config/accountTypes";
import type { UserProfile } from "../../features/auth/types";
import { hasSupabaseConfig } from "../supabase/config";
import { createSupabaseServerClient } from "../supabase/serverClient";

const profileColumns = "id,email,full_name,avatar_url,account_type,onboarding_completed,preferences,active_workspace_id,created_at,updated_at";

export async function getCurrentUserAndProfile() {
  if (!hasSupabaseConfig()) {
    return { user: null, profile: null };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as UserProfile | null };
}

export async function requireUser() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/login");
  }

  return { user, profile };
}

export function getPostAuthRedirect(profile?: Pick<UserProfile, "account_type" | "full_name" | "onboarding_completed"> | null) {
  if (!profile?.onboarding_completed || !profile.full_name || !profile.account_type) {
    return "/onboarding";
  }

  return getDashboardForAccountType(profile.account_type);
}
