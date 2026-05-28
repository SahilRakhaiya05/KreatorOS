"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "../lib/types";
import { getAgent } from "../lib/agents";

export function ConversationSidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: Conversation[];
  currentId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-sidebar">
      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>
      <p className="px-4 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Recent
      </p>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-3">
          {conversations.map((conv) => {
            const active = conv.id === currentId;
            return (
              <div
                key={conv.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{previewTitle(conv.title)}</p>
                  <p className="truncate text-xs text-muted-foreground">{getAgent(conv.agentId).name}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function previewTitle(title: string, maxWords = 4) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return title;
  }
  return `${words.slice(0, maxWords).join(" ")}...`;
}
