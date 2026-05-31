import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BrandProgramBuilderClient } from "@/features/brand/components/brandProgramBuilderClient";

export default function BrandCampaigns() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Program builder"
        title="Create programs creators can apply to"
        description="Publish marketplace programs, set budgets and deliverables, then review creator applications and chat inside collaboration rooms."
      />
      <BrandProgramBuilderClient />
    </AppShell>
  );
}
