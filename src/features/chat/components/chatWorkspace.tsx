"use client";

import { useState } from "react";
import { AlertCircle, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useChatController } from "../lib/useChatController";
import type { ProviderCatalogEntry } from "../lib/types";
import { ConversationSidebar } from "./conversationSidebar";
import { ProviderPicker } from "./providerPicker";
import { AgentPanel } from "./agentPanel";
import { ChatThread } from "./chatThread";
import { ChatComposer } from "./chatComposer";
import { getAgent } from "../lib/agents";

export function ChatWorkspace({ catalog }: { catalog: ProviderCatalogEntry[] }) {
  const chat = useChatController(catalog);
  const [showAgent, setShowAgent] = useState(true);
  const agentId = chat.current?.agentId ?? "operator";

  return (
    <div
      className={cn(
        "grid h-[calc(100vh-7rem)] min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[16rem_minmax(0,1fr)]",
        showAgent ? "xl:grid-cols-[16rem_minmax(0,1fr)_20rem]" : "xl:grid-cols-[16rem_minmax(0,1fr)]"
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
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5 md:px-6 xl:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{getAgent(agentId).name}</p>
            <p className="truncate text-xs text-muted-foreground">{chat.current?.title ?? "New chat"}</p>
          </div>
          <div className="flex items-center gap-2">
            <ProviderPicker
              catalog={catalog}
              provider={chat.provider}
              model={chat.model}
              onProviderChange={chat.setProvider}
              onModelChange={chat.setModel}
            />
            <Button
              variant="ghost"
              size="icon"
              className="hidden xl:inline-flex"
              onClick={() => setShowAgent((v) => !v)}
              aria-label="Toggle agent panel"
            >
              {showAgent ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
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
          />
        </div>

        <ChatComposer onSend={chat.send} onStop={chat.stop} streaming={chat.status === "streaming"} />
      </div>

      {/* Agent panel */}
      <div className={cn("hidden min-h-0", showAgent && "xl:block")}>
        <AgentPanel agentId={agentId} onAgentChange={chat.setAgent} onStarter={chat.send} />
      </div>
    </div>
  );
}
