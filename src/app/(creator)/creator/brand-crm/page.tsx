import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BrandCrmClient } from "@/features/brand/components/brandCrmClient";

export const metadata = {
  title: "Brand CRM — KreatorOS",
};

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Brand CRM"
        title="Media kits, leads, proposals, and deliverables"
        description="Build partnership pipelines, secure contract parameters, generate trackable campaign links, and let AI draft high-converting brand pitches."
      />
      <BrandCrmClient />
    </AppShell>
  );
}
