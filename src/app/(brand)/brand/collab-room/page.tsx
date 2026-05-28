import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const messages = [
  "Brand: Can we include usage rights for 30 days?",
  "AI Agent: I updated the proposal and flagged price impact.",
  "Creator: Approve 30 days if package is $1,400.",
  "Brand: Approved. Please upload draft by Friday.",
];

const checklist = ["Proposal approved", "Contract signed", "Payment held", "Draft due", "Final report"];

export default function BrandCollabRoom() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Collaboration room"
        title="One shared room for chat, proposal, files, approvals, and payment"
        description="Brand and creator should not manage a deal through messy email threads. The room becomes the source of truth."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>NotionFlow x Demo Creator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-border bg-secondary/50 pt-5">
            {messages.map((m, i) => (
              <div
                key={m}
                className={cn(
                  "max-w-[78%] rounded-xl p-4 text-sm leading-relaxed",
                  i % 2
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-card text-foreground ring-1 ring-border"
                )}
              >
                {m}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deal checklist</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {checklist.map((x, i) => (
                <div key={x} className="flex items-center justify-between py-3.5">
                  <p className="text-sm font-medium">{x}</p>
                  <Badge variant={i < 3 ? "success" : "warning"}>{i < 3 ? "Done" : "Pending"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
