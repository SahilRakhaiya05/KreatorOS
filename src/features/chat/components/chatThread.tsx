"use client";

import { useEffect, useRef } from "react";
import { Bot, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../lib/types";
import { getAgent } from "../lib/agents";

export function ChatThread({
  messages,
  agentId,
  streaming,
  onStarter,
}: {
  messages: ChatMessage[];
  agentId: string;
  streaming: boolean;
  onStarter: (text: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const agent = getAgent(agentId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{agent.name}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{agent.tagline}. Describe the outcome you want — it returns a plan you can approve.</p>
        <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
          {agent.starters.map((s) => (
            <button
              key={s}
              onClick={() => onStarter(s)}
              className="rounded-xl border border-border bg-card p-3 text-left text-sm transition hover:border-accent/40 hover:shadow-soft"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-8">
      {messages.map((m) => (
        <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
          {m.role === "assistant" ? (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
          ) : null}
          <div
            className={cn(
              "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-card-foreground shadow-sm"
            )}
          >
            {m.content || (streaming ? <StreamingDots /> : null)}
          </div>
          {m.role === "user" ? (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              <UserRound className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </span>
  );
}
