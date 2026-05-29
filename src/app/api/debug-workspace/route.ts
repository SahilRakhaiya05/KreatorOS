import { getSession } from "@/server/auth/getSession";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";

export const runtime = "nodejs";

export async function GET() {
  const steps: Record<string, unknown> = {};

  // Step 1: Check env
  steps["1_hasServiceConfig"] = hasSupabaseServiceConfig();

  // Step 2: Get session
  const { user } = await getSession();
  steps["2_session_userId"] = user?.id ?? null;
  steps["2_session_email"] = user?.email ?? null;

  if (!user) {
    return Response.json({ error: "Not authenticated", steps }, { status: 401 });
  }

  // Step 3: Query profile with service client
  try {
    const supabase = hasSupabaseServiceConfig()
      ? createSupabaseServiceClient()
      : await createSupabaseServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, account_type, onboarding_completed, active_workspace_id, preferences")
      .eq("id", user.id)
      .maybeSingle();

    steps["3_profile"] = profile;
    steps["3_profileError"] = profileError?.message ?? null;

    if (!profile) {
      return Response.json({ error: "Profile not found", steps }, { status: 404 });
    }

    // Step 4: Query workspace_members for this user
    const { data: memberships, error: membershipsError } = await supabase
      .from("workspace_members")
      .select("*, workspaces(*)")
      .eq("user_id", user.id);

    steps["4_memberships"] = memberships;
    steps["4_membershipsError"] = membershipsError?.message ?? null;

    // Step 5: Query workspaces owned by this user
    const { data: ownedWorkspaces, error: ownedError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_id", user.id);

    steps["5_ownedWorkspaces"] = ownedWorkspaces;
    steps["5_ownedError"] = ownedError?.message ?? null;

    // Step 6: Try the exact query from getActiveWorkspace
    const { data: profileWithMembers, error: joinError } = await supabase
      .from("profiles")
      .select("active_workspace_id, account_type, email, full_name, preferences, workspace_members:workspace_members!user_id(role, status, workspaces(id, type, status))")
      .eq("id", user.id)
      .maybeSingle();

    steps["6_profileWithMembers"] = profileWithMembers;
    steps["6_joinError"] = joinError?.message ?? null;

    return Response.json({ steps });
  } catch (e) {
    steps["exception"] = (e as Error).message;
    return Response.json({ error: "Exception during debug", steps }, { status: 500 });
  }
}
