"use client";

import { Workflow, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENTS, getAgent } from "../lib/agents";

export function AgentPanel({
  agentId,
  onAgentChange,
  onStarter,
}: {
  agentId: string;
  onAgentChange: (id: string) => void;
  onStarter: (text: string) => void;
}) {
  const agent = getAgent(agentId);
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Agent</p>
        <div className="mt-2 space-y-1.5">
          {AGENTS.map((a) => {
            const active = a.id === agentId;
            return (
              <button
                key={a.id}
                onClick={() => onAgentChange(a.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left transition",
                  active ? "border-accent/40 bg-accent/5" : "border-border hover:bg-secondary"
                )}
              >
                <p className={cn("text-sm font-semibold", active && "text-accent")}>{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Workflow className="h-4 w-4 text-accent" /> Execution model
        </p>
        <ol className="mt-3 space-y-2">
          {agent.workflow.map((step, i) => (
            <li key={step.tool} className="flex items-start gap-3 rounded-lg bg-secondary/60 p-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-card text-xs font-semibold ring-1 ring-border">
                {i + 1}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">{step.label}</p>
                <p className="font-mono text-[0.7rem] text-muted-foreground">{step.tool}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Try a prompt</p>
        <div className="mt-2 space-y-1.5">
          {agent.starters.map((s) => (
            <button
              key={s}
              onClick={() => onStarter(s)}
              className="group flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="flex-1">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
        Actions are drafted and queued for your approval before anything goes live.
      </div>
    </div>
  );
}
