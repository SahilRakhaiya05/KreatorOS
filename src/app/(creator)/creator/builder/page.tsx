import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BioBuilder } from "@/features/bioBuilder/components/bioBuilder";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Bio + store builder"
        title="Design a dynamic public page that sells"
        description="Each block has real business behavior: checkout, calendar, CRM, brand intake, member gating, workflow triggers, and analytics."
      />
      <BioBuilder />
    </AppShell>
  );
}
