import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/shared/mock/data";
import { ShieldCheck, Sparkles } from "lucide-react";
import { requireUser } from "@/server/profile/profileService";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { AssistantConfigClient } from "@/features/assistant/components/assistantConfigClient";
import { AgentCreateClient } from "@/features/agents/components/agentCreateClient";
import { ApprovalQueueDashboard } from "@/features/agents/components/approvalQueueDashboard";

type Status = (typeof agents)[number]["status"] | "Active";

const statusVariant: Record<string, "success" | "accent" | "default" | "secondary"> = {
  Active: "success",
  Beta: "accent",
  "Always on": "default",
  Draft: "secondary",
};

export default async function Page() {
  const { user, profile } = await requireUser();
  const workspace = await getActiveWorkspace(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: page } = await supabase
    .from("creator_pages")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: assistant } = page
    ? await supabase.from("creator_ai_assistants").select("*").eq("page_id", page.id).maybeSingle()
    : { data: null };

  const { data: suggestions } = workspace
    ? await supabase
        .from("ai_suggestions")
        .select("id, title, risk_level, status")
        .eq("workspace_id", workspace.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: dbAgents } = workspace
    ? await supabase
        .from("ai_agents")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { count: sessionCount } = workspace
    ? await supabase.from("assistant_chat_sessions").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id)
    : { count: 0 };

  const { count: messageCount } = workspace
    ? await supabase.from("assistant_chat_messages").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id)
    : { count: 0 };

  const { count: leadCount } = workspace
    ? await supabase.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id)
    : { count: 0 };

  const { count: recommendationCount } = workspace
    ? await supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("event_type", "assistant.message")
    : { count: 0 };

  const assistantMetrics = [
    { label: "Assistant sessions", value: sessionCount ?? 0, detail: "Real public chat sessions" },
    { label: "Messages", value: messageCount ?? 0, detail: "Visitor and assistant messages" },
    { label: "Captured leads", value: leadCount ?? 0, detail: "Saved from assistant widget" },
    { label: "Recommendations", value: recommendationCount ?? 0, detail: "Offer suggestions tracked" },
  ];


  const customAgentsMapped = (dbAgents || []).map((agent) => ({
    name: agent.name,
    icon: Sparkles,
    status: "Active",
    scope: agent.scope || agent.description || "Custom configured assistant agent.",
    tools: agent.tools || [],
  }));

  const allAgents = [...customAgentsMapped, ...agents];

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Agent builder"
        title="Create specialized AI agents"
        description="Agents are app-native workers with tools, memory, permissions, and approval rules. They can read the business graph, draft actions, call provider adapters, and execute only within their scope."
        action={<AgentCreateClient />}
      />
      <AssistantConfigClient workspaceId={workspace?.id ?? ""} pageId={page?.id ?? null} assistant={assistant} />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {assistantMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <p className="font-mono text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-1 text-sm font-semibold">{metric.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {allAgents.map((agent) => {
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
                  {(agent.tools as string[]).slice(0, 3).map((tool: string) => (
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
      <Card className="mt-6">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Approval queue</h2>
              <p className="text-sm text-muted-foreground">High-risk AI actions wait here before changing business data.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <ApprovalQueueDashboard initialSuggestions={suggestions || []} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
