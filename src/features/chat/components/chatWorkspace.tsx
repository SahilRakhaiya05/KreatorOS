"use client";

import { AlertCircle, Bot, Shield, ShieldAlert, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatController } from "../lib/useChatController";
import type { ProviderCatalogEntry } from "../lib/types";
import { ConversationSidebar } from "./conversationSidebar";
import { ChatThread } from "./chatThread";
import { ChatComposer } from "./chatComposer";
import { getAgent } from "../lib/agents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

          {/* Access Mode Selector */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-soft ring-1 transition-all duration-200 outline-none hover:bg-secondary/40",
                  chat.accessMode === "full" 
                    ? "bg-orange-500/10 ring-orange-500/30 text-orange-500" 
                    : "bg-secondary/20 ring-border/80 text-muted-foreground"
                )}>
                  {chat.accessMode === "full" ? (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  ) : (
                    <Shield className="h-3.5 w-3.5" />
                  )}
                  <span>{chat.accessMode === "full" ? "Full access" : "Needs approval"}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl bg-card border-border/80 shadow-soft">
                <DropdownMenuItem
                  onClick={() => chat.setAccessMode("approval")}
                  className={cn(
                    "flex flex-col items-start gap-1 p-2.5 rounded-xl transition-all cursor-pointer",
                    chat.accessMode === "approval" ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    Needs approval
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Operator queues suggestions in the thread. Safe and gated—nothing goes live without your consent.
                  </p>
                </DropdownMenuItem>
                <div className="h-px bg-border/40 my-1" />
                <DropdownMenuItem
                  onClick={() => chat.setAccessMode("full")}
                  className={cn(
                    "flex flex-col items-start gap-1 p-2.5 rounded-xl transition-all cursor-pointer",
                    chat.accessMode === "full" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "text-muted-foreground hover:bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-orange-600 dark:text-orange-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Full access
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Allows the AI to automatically edit and update your store, smart-link, or layouts without requiring manual approval.
                  </p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            onReject={chat.rejectSuggestion}
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
