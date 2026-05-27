import { AppShell } from "@/components/layout/appShell";
import { AIOperator } from "@/features/aiOperator/components/aiOperator";
import { PageTitle } from "@/components/ui";
export default function Page(){return <AppShell role="creator"><div className="space-y-6"><PageTitle eyebrow="AI operator" title="A custom AI agent that works inside your SaaS, not a generic chatbot." text="It can read workspace knowledge, draft records, create workflows, check policy, ask approval, and execute actions through provider adapters."/><AIOperator/></div></AppShell>}
