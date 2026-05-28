import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BioBuilder } from "@/features/bioBuilder/components/bioBuilder";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Site builder"
        title="Design your page and preview it live"
        description="Edit blocks, themes, and layout on the left and watch the public page update in a realistic device preview on the right."
      />
      <BioBuilder />
    </AppShell>
  );
}
