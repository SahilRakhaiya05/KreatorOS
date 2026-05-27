import { AppShell } from "@/components/layout/appShell";
import { BioBuilder } from "@/features/bioBuilder/components/bioBuilder";
import { PageTitle } from "@/components/ui";
export default function Page(){return <AppShell role="creator"><div className="space-y-6"><PageTitle eyebrow="Bio + store builder" title="Design a dynamic public page that sells, books, gates, routes, and automates." text="Each block has real business behavior: checkout, calendar, CRM, brand intake, member gating, workflow triggers, and analytics."/><BioBuilder/></div></AppShell>}
