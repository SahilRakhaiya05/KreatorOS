"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProviderId } from "@/server/ai/providers";
import { DEFAULT_AGENT_ID } from "./agents";
import type { ChatMessage, Conversation, ProviderCatalogEntry } from "./types";

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

export function useChatController(catalog: ProviderCatalogEntry[]) {
  const firstAvailable = useMemo(
    () => catalog.find((p) => p.available) ?? catalog[0],
    [catalog]
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [provider, setProvider] = useState<ProviderId>(firstAvailable.id);
  const [model, setModel] = useState<string>(firstAvailable.models[0]?.id ?? "");
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
    const seed = newConversation();
    setConversations([seed]);
    setCurrentId(seed.id);
  }, []);

  // Persist.
  useEffect(() => {
    if (conversations.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 30)));
      } catch {
        /* ignore */
      }
    }
  }, [conversations]);

  const current = conversations.find((c) => c.id === currentId) ?? null;

  const setModelForProvider = useCallback(
    (next: ProviderId) => {
      setProvider(next);
      const entry = catalog.find((p) => p.id === next);
      setModel(entry?.models[0]?.id ?? "");
    },
    [catalog]
  );

  const createConversation = useCallback(() => {
    const conv = newConversation(current?.agentId);
    setConversations((prev) => [conv, ...prev]);
    setCurrentId(conv.id);
    setError(null);
  }, [current?.agentId]);

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
      setConversations((prev) =>
        prev.map((c) => (c.id === current.id ? { ...c, agentId } : c))
      );
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
      if (!value || !current || status === "streaming") return;
      setError(null);

      const userMsg: ChatMessage = { id: uid(), role: "user", content: value };
      const assistantMsg: ChatMessage = { id: uid(), role: "assistant", content: "" };
      const convId = current.id;
      const agentId = current.agentId;
      const history = [...current.messages, userMsg];

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
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
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
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
    [current, provider, model, status]
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
    setAgent,
    status,
    error,
    send,
    stop,
  };
}
