import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BrandProgramBuilderClient } from "@/features/brand/components/brandProgramBuilderClient";

export default function BrandCampaigns() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Program builder"
        title="Create programs creators can apply to"
        description="Publish campaigns, define deliverables, and coordinate creator pitches."
      />
      <BrandProgramBuilderClient />
    </AppShell>
  );
}
