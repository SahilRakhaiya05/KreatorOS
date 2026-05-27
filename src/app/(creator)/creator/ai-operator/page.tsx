import { AppShell, PageHeader } from "@/components/layout/appShell";
import { AIOperator } from "@/features/aiOperator/components/aiOperator";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="AI operator"
        title="A custom AI agent that works inside your SaaS"
        description="It can read workspace knowledge, draft records, create workflows, check policy, ask approval, and execute actions through provider adapters."
      />
      <AIOperator />
    </AppShell>
  );
}
