import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view the current user.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,avatar_url,account_type,onboarding_completed,active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  const activeWorkspace = await getActiveWorkspace(user.id);

  return apiOk({ user, profile, activeWorkspace });
}
