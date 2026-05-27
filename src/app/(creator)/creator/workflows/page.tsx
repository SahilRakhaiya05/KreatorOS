import { AppShell, PageHeader } from "@/components/layout/appShell";
import { WorkflowCanvas } from "@/features/workflow/components/workflowCanvas";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Workflow editor"
        title="Build node-style AI automation flows"
        description="Turn business events into guarded automations across pages, bookings, payments, brands, research, and support. Every node has tool access, conditions, retry logic, permissions, and audit logging."
      />
      <WorkflowCanvas />
    </AppShell>
  );
}
