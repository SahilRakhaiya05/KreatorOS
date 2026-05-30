"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Bot, Check, Loader2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChatApproval, ChatMessage } from "../lib/types";
import { getAgent } from "../lib/agents";

export function ChatThread({
  messages,
  agentId,
  streaming,
  onStarter,
  onApprove,
}: {
  messages: ChatMessage[];
  agentId: string;
  streaming: boolean;
  onStarter: (text: string) => void;
  onApprove: (suggestionId: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const agent = getAgent(agentId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center md:px-10">
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
              className="rounded-xl border border-border/70 bg-background/60 p-3 text-left text-sm transition hover:border-accent/40 hover:bg-secondary/50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 lg:px-10">
      {messages.map((m) => (
        <div key={m.id} className={cn("flex items-end gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
          {m.role === "assistant" ? (
            <div className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-2xl bg-secondary/70 text-accent ring-1 ring-border/60">
              <Bot className="h-4 w-4" />
            </div>
          ) : null}

          <div
            className={cn(
              "max-w-[min(100%,52rem)] rounded-3xl px-4 py-3 text-sm leading-7 shadow-sm",
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "border border-border/70 bg-background/80 text-foreground/90 backdrop-blur-sm"
            )}
          >
            {m.role === "assistant" ? <AssistantContent content={m.content} streaming={streaming} /> : <UserContent content={m.content} />}
            {m.role === "assistant" && m.approvals?.length ? (
              <ApprovalCards approvals={m.approvals} onApprove={onApprove} />
            ) : null}
          </div>

          {m.role === "user" ? (
            <div className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-2xl bg-secondary text-secondary-foreground ring-1 ring-border/60">
              <UserRound className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function ApprovalCards({
  approvals,
  onApprove,
}: {
  approvals: ChatApproval[];
  onApprove: (suggestionId: string) => void;
}) {
  return (
    <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
      {approvals.map((approval) => {
        const applied = approval.status === "applied";
        return (
          <div key={approval.id} className="rounded-2xl border border-border bg-card/90 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <p className="text-sm font-semibold text-foreground">{approval.title}</p>
                  <Badge variant={approval.riskLevel === "high" ? "destructive" : approval.riskLevel === "medium" ? "warning" : "success"}>
                    {approval.riskLevel}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {applied ? "Approved and applied from chat." : "Approval is required before this changes your app."}
                </p>
              </div>
              <Button size="sm" disabled={applied} onClick={() => onApprove(approval.id)}>
                {applied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Loader2 className="mr-1.5 h-3.5 w-3.5" />}
                {applied ? "Applied" : "Approve"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserContent({ content }: { content: string }) {
  return <div className="whitespace-pre-wrap">{content}</div>;
}

function AssistantContent({ content, streaming }: { content: string; streaming: boolean }) {
  if (!content && streaming) {
    return <StreamingDots />;
  }

  const blocks = parseBlocks(content);
  return <div className="space-y-4">{blocks.map((block, index) => renderBlock(block, index))}</div>;
}

type Block = { kind: "paragraph"; text: string } | { kind: "unordered"; items: string[] } | { kind: "ordered"; items: string[] };

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let currentParagraph: string[] = [];
  let currentList: { kind: "unordered" | "ordered"; items: string[] } | null = null;

  const flushParagraph = () => {
    if (!currentParagraph.length) return;
    blocks.push({ kind: "paragraph", text: currentParagraph.join(" ").trim() });
    currentParagraph = [];
  };

  const flushList = () => {
    if (!currentList) return;
    blocks.push({ kind: currentList.kind, items: currentList.items });
    currentList = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const unorderedMatch = line.match(/^[*-]\s+(.+)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (unorderedMatch) {
      flushParagraph();
      if (!currentList || currentList.kind !== "unordered") {
        flushList();
        currentList = { kind: "unordered", items: [] };
      }
      currentList.items.push(unorderedMatch[1]);
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      if (!currentList || currentList.kind !== "ordered") {
        flushList();
        currentList = { kind: "ordered", items: [] };
      }
      currentList.items.push(orderedMatch[1]);
      continue;
    }

    flushList();
    currentParagraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderBlock(block: Block, index: number) {
  if (block.kind === "paragraph") {
    return (
      <p key={index} className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
        {renderInline(block.text)}
      </p>
    );
  }

  const ListTag = block.kind === "ordered" ? "ol" : "ul";
  return (
    <ListTag key={index} className={cn("space-y-2 pl-5", block.kind === "ordered" ? "list-decimal" : "list-disc")}>
      {block.items.map((item, itemIndex) => (
        <li key={itemIndex} className="pl-1 text-[15px] leading-7 text-foreground/90">
          {renderInline(item)}
        </li>
      ))}
    </ListTag>
  );
}

function renderInline(text: string) {
  const parts: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
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
