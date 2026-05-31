import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BrandCollabRoomClient } from "@/features/brand/components/brandCollabRoomClient";

export const metadata = { title: "Collaboration Room — KreatorOS" };

export default function BrandCollabRoom() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Collaboration room"
        title="Creator-Brand Workspace Portal"
        description="Secure room for contract proposals, deliverables, live chat, and escrow settlements."
      />
      <BrandCollabRoomClient />
    </AppShell>
  );
}
