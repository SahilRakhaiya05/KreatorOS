"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProviderId } from "@/server/ai/providers";
import { analyticsEvents, captureClientEvent } from "@/client/posthog/events";
import { AGENTS, DEFAULT_AGENT_ID } from "./agents";
import type { ChatApproval, ChatMessage, Conversation, ProviderCatalogEntry } from "./types";

const STORAGE_KEY = "kreatoros.chat.v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function newConversation(agentId = DEFAULT_AGENT_ID): Conversation {
  return { id: uid(), title: "New chat", agentId, messages: [], updatedAt: Date.now() };
}

function deriveTitle(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || "New chat";
}

function normalizeApproval(item: any): ChatApproval {
  return {
    id: String(item.id),
    title: String(item.title ?? "AI suggestion"),
    riskLevel: (item.risk_level ?? "medium") as ChatApproval["riskLevel"],
    status: String(item.status ?? "pending"),
  };
}

export function useChatController(catalog: ProviderCatalogEntry[]) {
  const firstAvailable = useMemo(
    () => catalog.find((p) => p.available) ?? catalog[0],
    [catalog]
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [provider, setProvider] = useState<ProviderId>(firstAvailable.id);
  const [model, setModel] = useState<string>(firstAvailable.models[0]?.id ?? "");
  const [activeAgentId, setActiveAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hydrate from localStorage once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Conversation[];
        if (Array.isArray(saved) && saved.length) {
          setConversations(saved);
          setCurrentId(saved[0].id);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setConversations([]);
    setCurrentId("");
  }, []);

  // Persist.
  useEffect(() => {
    if (conversations.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 30)));
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [conversations]);

  const current = conversations.find((c) => c.id === currentId) ?? conversations[0] ?? null;

  useEffect(() => {
    if (current) {
      setActiveAgentId(current.agentId);
    }
  }, [currentId, current?.agentId]);

  const setModelForProvider = useCallback(
    (next: ProviderId) => {
      setProvider(next);
      const entry = catalog.find((p) => p.id === next);
      setModel(entry?.models[0]?.id ?? "");
    },
    [catalog]
  );

  const createConversation = useCallback(() => {
    if (!current) {
      const seed = newConversation(activeAgentId);
      setConversations([seed]);
      setCurrentId(seed.id);
      setError(null);
      return;
    }

    if (current.messages.length === 0) {
      setCurrentId(current.id);
      setError(null);
      return;
    }

    const conv = newConversation(activeAgentId);
    setConversations((prev) => [conv, ...prev]);
    setCurrentId(conv.id);
    setError(null);
  }, [current, currentId, activeAgentId]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (!next.length) {
          const seed = newConversation();
          setCurrentId(seed.id);
          return [seed];
        }
        if (id === currentId) setCurrentId(next[0].id);
        return next;
      });
    },
    [currentId]
  );

  const setAgent = useCallback(
    (agentId: string) => {
      if (!current) return;
      setActiveAgentId(agentId);
      if (current.messages.length === 0) {
        setConversations((prev) => prev.map((c) => (c.id === current.id ? { ...c, agentId } : c)));
      }
    },
    [current]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const send = useCallback(
    async (text: string) => {
      const value = text.trim();
      if (!value || status === "streaming") return;
      setError(null);
      const mentionedAgent = AGENTS.find((agent) =>
        new RegExp(`(^|\\s)${agent.handle.replace("@", "\\@")}(\\s|$)`, "i").test(value)
      );
      const nextAgentId = mentionedAgent?.id ?? activeAgentId;
      if (mentionedAgent) setActiveAgentId(mentionedAgent.id);

      let activeConversation = current;
      if (!activeConversation) {
        activeConversation = conversations[0] ?? newConversation(activeAgentId);
        if (!conversations.length) {
          setConversations([activeConversation]);
        }
        setCurrentId(activeConversation.id);
      }

      const userMsg: ChatMessage = { id: uid(), role: "user", content: value };
      const assistantMsg: ChatMessage = { id: uid(), role: "assistant", content: "" };
      const convId = activeConversation.id;
      const agentId = nextAgentId;
      const history = [...activeConversation.messages, userMsg];
      captureClientEvent(analyticsEvents.chatMessageSent, {
        provider,
        model,
        agent_id: agentId,
        conversation_id: convId,
        message_count: history.length,
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                agentId,
                title: c.messages.length === 0 ? deriveTitle(value) : c.title,
                messages: [...c.messages, userMsg, assistantMsg],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      setStatus("streaming");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const beforeSuggestions = await fetch("/api/ai/suggestions?status=pending&limit=12")
          .then((res) => res.json())
          .then((json) => new Set((json?.data?.suggestions ?? []).map((item: any) => String(item.id))))
          .catch(() => new Set<string>());

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            provider,
            model,
            agentId,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Request failed.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          acc += decoder.decode(chunk, { stream: true });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: acc } : m)),
                  }
                : c
            )
          );
        }

        captureClientEvent(analyticsEvents.chatResponseCompleted, {
          provider,
          model,
          agent_id: agentId,
          conversation_id: convId,
          response_length: acc.length,
        });

        const pendingApprovals = await fetch("/api/ai/suggestions?status=pending&limit=12")
          .then((res) => res.json())
          .then((json) =>
            (json?.data?.suggestions ?? [])
              .filter((item: any) => !beforeSuggestions.has(String(item.id)))
              .map(normalizeApproval)
          )
          .catch(() => [] as ChatApproval[]);

        if (pendingApprovals.length) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsg.id ? { ...m, approvals: pendingApprovals } : m
                    ),
                  }
                : c
            )
          );
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        captureClientEvent(analyticsEvents.chatResponseFailed, {
          provider,
          model,
          agent_id: agentId,
          conversation_id: convId,
          error: message,
        });
        setError(message);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.filter((m) => m.id !== assistantMsg.id) }
              : c
          )
        );
      } finally {
        setStatus("idle");
        abortRef.current = null;
      }
    },
    [current, conversations, provider, model, status, activeAgentId]
  );

  const approveSuggestion = useCallback(
    async (suggestionId: string) => {
      try {
        const approveRes = await fetch(`/api/ai/suggestions/${suggestionId}/approve`, { method: "POST" });
        const approveJson = await approveRes.json();
        if (!approveJson?.ok) throw new Error(approveJson?.error?.message ?? "Approval failed.");

        const applyRes = await fetch(`/api/ai/suggestions/${suggestionId}/apply`, { method: "POST" });
        const applyJson = await applyRes.json();
        if (!applyJson?.ok) throw new Error(applyJson?.error?.message ?? "Apply failed.");

        setConversations((prev) =>
          prev.map((conversation) => ({
            ...conversation,
            messages: conversation.messages.map((message) => ({
              ...message,
              approvals: message.approvals?.map((approval) =>
                approval.id === suggestionId ? { ...approval, status: "applied" } : approval
              ),
            })),
          }))
        );
      } catch (error) {
        setError(error instanceof Error ? error.message : "Approval failed.");
      }
    },
    []
  );

  return {
    conversations,
    current,
    currentId,
    setCurrentId,
    createConversation,
    deleteConversation,
    provider,
    setProvider: setModelForProvider,
    model,
    setModel,
    activeAgentId,
    setAgent,
    status,
    error,
    send,
    stop,
    approveSuggestion,
  };
}
