import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { agents } from "@/shared/mock/data";
import { Plus } from "lucide-react";

type Status = (typeof agents)[number]["status"];

const statusVariant: Record<string, "success" | "accent" | "default" | "secondary"> = {
  Active: "success",
  Beta: "accent",
  "Always on": "default",
  Draft: "secondary",
};

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Agent builder"
        title="Create specialized AI agents"
        description="Agents are app-native workers with tools, memory, permissions, and approval rules. They can read the business graph, draft actions, call provider adapters, and execute only within their scope."
        action={
          <Button>
            <Plus className="h-4 w-4" /> New agent
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.name} className="transition hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <Badge variant={statusVariant[agent.status as Status] ?? "secondary"}>{agent.status}</Badge>
                </div>
                <h2 className="mt-4 font-semibold tracking-tight">{agent.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{agent.scope}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.tools.slice(0, 3).map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-border bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
