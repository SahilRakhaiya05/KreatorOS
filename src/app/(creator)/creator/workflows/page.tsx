import { AppShell } from "@/components/layout/appShell";
import { WorkflowCanvas } from "@/features/workflow/components/workflowCanvas";
import { PageTitle } from "@/components/ui";
export default function Page(){return <AppShell role="creator"><div className="space-y-6"><PageTitle eyebrow="Workflow editor" title="Build node-style AI automation flows across pages, bookings, payments, brands, research, and support." text="The workflow canvas turns business events into guarded automations. Every node has tool access, conditions, retry logic, permissions, and audit logging."/><WorkflowCanvas/></div></AppShell>}
