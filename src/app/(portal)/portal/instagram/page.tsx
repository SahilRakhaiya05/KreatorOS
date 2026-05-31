import { redirect } from "next/navigation";
import { portalService } from "@/server/portal/portalService";
import { getSession } from "@/server/auth/getSession";
import { InstagramLibrary } from "@/features/instagramCapture/components/instagramLibrary";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { listInstagramCaptures } from "@/server/instagram/captureService";

export default async function PortalInstagramPage() {
  const { user } = await getSession();
  if (!user) redirect("/login?next=/portal/instagram");

  // Enforce portal customer access and resolve their workspace scope
  const { customer, workspaceId } = await portalService.requirePortalCustomer();

  // Query only the captures owned strictly by this authenticated user
  const captures = await listInstagramCaptures({ userId: user.id, workspaceId });
  const rows = captures.ok ? captures.data : [];

  return (
    <AppShell role="portal">
      <PageHeader
        eyebrow="Client portal"
        title="My Instagram Saves"
        description="Curate, search, and manage your saved Instagram posts and swipes."
      />
      <InstagramLibrary captures={rows} />
    </AppShell>
  );
}
