import { AppShell, PageHeader } from "@/components/layout/appShell";
import { SettingsClient } from "./settings-client";

export default function Page() {
  const stripeConnected = Boolean(process.env.STRIPE_SECRET_KEY);

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
