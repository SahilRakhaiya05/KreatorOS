import { AppShell, PageHeader } from "@/components/layout/appShell";
import { WorkflowCanvas } from "@/features/workflow/components/workflowCanvas";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="KOffice"
        title="Run web research from a live creator office"
        description="Search public source leads, assign research agents, track the source queue, and turn findings into creator-ready briefs inside a Claude Office-inspired workspace."
      />
      <WorkflowCanvas />
    </AppShell>
  );
}
