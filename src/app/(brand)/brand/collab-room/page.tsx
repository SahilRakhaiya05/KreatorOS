import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BrandCollabRoomClient } from "@/features/brand/components/brandCollabRoomClient";

export const metadata = { title: "Collaboration Room — KreatorOS" };

export default function BrandCollabRoom() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Collaboration room"
        title="Creator-Brand Workspace Portal"
        description="A unified, secure room for contract proposals, deliverables, live chat, escrow holds, and campaign reports."
      />
      <BrandCollabRoomClient />
    </AppShell>
  );
}
