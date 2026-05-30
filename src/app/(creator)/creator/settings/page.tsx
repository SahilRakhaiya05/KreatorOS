import { AppShell, PageHeader } from "@/components/layout/appShell";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { SettingsClient } from "./settings-client";

export default async function Page() {
  const { user } = await getSession();
  const workspace = user ? await getActiveWorkspace(user.id) : null;
  let stripeConnected = false;

  if (workspace) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("provider_connections")
      .select("status,metadata")
      .eq("workspace_id", workspace.id)
      .eq("provider", "stripe")
      .maybeSingle();

    stripeConnected =
      (data?.status === "connected" || data?.status === "sandbox") &&
      Boolean((data?.metadata as Record<string, unknown> | null)?.stripe_account_id);
  }

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage your profile, payments, connectors, and notifications."
      />
      <SettingsClient stripeConnected={stripeConnected} />
    </AppShell>
  );
}
