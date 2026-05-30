"use client";

import { useRef, useState } from "react";
import { ArrowUp, Bot, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AGENTS } from "../lib/agents";

export function ChatComposer({
  onSend,
  onStop,
  streaming,
  activeAgentId,
  onAgentChange,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  activeAgentId: string;
  onAgentChange: (agentId: string) => void;
}) {
  const [value, setValue] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const filteredAgents = AGENTS.filter((agent) =>
    `${agent.name} ${agent.handle} ${agent.tagline}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  function submit() {
    if (!value.trim() || streaming) return;
    onSend(value);
    setValue("");
    setMentionOpen(false);
    if (ref.current) ref.current.style.height = "auto";
  }

  function selectAgent(agentId: string) {
    const agent = AGENTS.find((item) => item.id === agentId);
    if (!agent) return;
    onAgentChange(agent.id);
    setMentionOpen(false);
    setMentionQuery("");
    setValue((current) => current.replace(/(^|\s)@[\w-]*$/, `$1${agent.handle} `));
    requestAnimationFrame(() => ref.current?.focus());
  }

  return (
    <div className="border-t border-border bg-background/95 p-3 backdrop-blur-xl md:p-4">
      <div className="relative mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-sm transition focus-within:border-ring focus-within:shadow-md">
        {mentionOpen ? (
          <div className="absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
            <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              Call an agent
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {(filteredAgents.length ? filteredAgents : AGENTS).map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => selectAgent(agent.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-secondary",
                    agent.id === activeAgentId && "bg-secondary"
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{agent.handle}</span>
                    <span className="block truncate text-xs text-muted-foreground">{agent.tagline}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <textarea
          ref={ref}
          value={value}
          rows={1}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            const mention = next.match(/(^|\s)@([\w-]*)$/);
            setMentionOpen(Boolean(mention));
            setMentionQuery(mention?.[2] ?? "");
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if (mentionOpen && e.key === "Escape") {
              setMentionOpen(false);
              return;
            }
            if (mentionOpen && e.key === "Tab") {
              e.preventDefault();
              selectAgent((filteredAgents[0] ?? AGENTS[0]).id);
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask the operator to read your workspace, update your smart link, draft products, build pages, or type @ to call a specialist..."
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground"
        />
        {streaming ? (
          <Button size="icon" variant="outline" onClick={onStop} aria-label="Stop">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" onClick={submit} disabled={!value.trim()} aria-label="Send">
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
