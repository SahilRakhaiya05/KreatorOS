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
    <div className="grid h-[calc(100vh-8.5rem)] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card shadow-soft lg:grid-cols-[16rem_1fr] xl:grid-cols-[16rem_1fr_20rem]">
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
      <div className="flex min-w-0 flex-col bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{getAgent(agentId).name}</p>
            <p className="truncate text-xs text-muted-foreground">{chat.current?.title}</p>
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

        {chat.error ? (
          <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {chat.error}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
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
      <div className={cn("hidden", showAgent && "xl:block")}>
        <AgentPanel agentId={agentId} onAgentChange={chat.setAgent} onStarter={chat.send} />
      </div>
    </div>
  );
}
