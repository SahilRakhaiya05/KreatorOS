import { AppShell } from "@/components/layout/appShell";
import { PageTitle, Card, Badge } from "@/components/ui";
export default function Page(){return <AppShell role="portal"><div className="space-y-6"><PageTitle eyebrow="Membership" title="Gated posts, office hours, resources, and community updates."/><Card className="p-5"><Badge tone="green">Active member</Badge><h2 className="mt-4 font-black">AI Creator Club</h2><p className="mt-2 text-sm text-slate-600">Weekly resources, live office hours, prompt drops, and member challenges.</p></Card></div></AppShell>}
