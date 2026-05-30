"use client";

import { AlertCircle, Bot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatController } from "../lib/useChatController";
import type { ProviderCatalogEntry } from "../lib/types";
import { ConversationSidebar } from "./conversationSidebar";
import { ChatThread } from "./chatThread";
import { ChatComposer } from "./chatComposer";
import { getAgent } from "../lib/agents";

export function ChatWorkspace({ catalog }: { catalog: ProviderCatalogEntry[] }) {
  const chat = useChatController(catalog);
  const agentId = chat.current?.agentId ?? "operator";
  const agent = getAgent(agentId);

  return (
    <div
      className={cn(
        "grid h-[calc(100vh-7rem)] min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[16rem_minmax(0,1fr)]"
      )}
    >
      {/* Conversation sidebar */}
      <div className="hidden lg:block">
        <ConversationSidebar
          conversations={chat.conversations}
          currentId={chat.currentId}
          onSelect={chat.setCurrentId}
          onNew={chat.createConversation}
          onDelete={chat.deleteConversation}
        />
      </div>

      {/* Main column */}
      <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 md:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{agent.name}</p>
              <p className="truncate text-xs text-muted-foreground">{agent.tagline}</p>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            Chat history saved
          </div>
        </div>

        <div className="no-scrollbar min-h-0 overflow-y-auto">
          {chat.error ? (
            <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive md:mx-8 lg:mx-10">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {chat.error}
            </div>
          ) : null}
          <ChatThread
            messages={chat.current?.messages ?? []}
            agentId={agentId}
            streaming={chat.status === "streaming"}
            onStarter={chat.send}
            onApprove={chat.approveSuggestion}
          />
        </div>

        <ChatComposer
          onSend={chat.send}
          onStop={chat.stop}
          streaming={chat.status === "streaming"}
          activeAgentId={agentId}
          onAgentChange={chat.setAgent}
        />
      </div>
    </div>
  );
}
