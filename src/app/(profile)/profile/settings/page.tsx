import { AppShell, PageHeader } from "../../../../components/layout/appShell";
import { ProfileSettingsForm } from "../../../../features/auth/components/profileSettingsForm";
import { requireUser } from "../../../../server/profile/profileService";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const { user, profile } = await requireUser();

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Profile settings"
        title="Manage your unified KreatorOS account."
        description="Update your profile, change account type, manage password, and control the dashboard this account opens first."
      />
      <ProfileSettingsForm profile={profile} email={user.email} />
    </AppShell>
  );
}
