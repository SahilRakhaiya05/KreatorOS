"use client";

import { useEffect, useState, useTransition } from "react";
import { Bot, Mail, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AssistantOffer = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  price_cents: number;
  currency: string;
  slug: string;
};

type ChatMessage = {
  role: "visitor" | "assistant";
  content: string;
  offers?: AssistantOffer[];
};

export function PublicAssistantWidget({
  pageId,
  welcomeMessage,
}: {
  pageId: string;
  welcomeMessage?: string | null;
}) {
  const [visitorId, setVisitorId] = useState("anonymous");
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: welcomeMessage || "Tell me your goal and I will recommend the best product, call, or membership.",
    },
  ]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const key = "kreatoros.public.visitor";
      const existing = window.localStorage.getItem(key);
      if (existing) {
        setVisitorId(existing);
        return;
      }
      const next = crypto.randomUUID();
      window.localStorage.setItem(key, next);
      setVisitorId(next);
    } catch {
      setVisitorId("anonymous");
    }
  }, []);

  function sendMessage() {
    const message = input.trim();
    if (!message) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "visitor", content: message }]);

    startTransition(async () => {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageId, sessionId: sessionId ?? undefined, visitorId, message }),
      });
      const json = await res.json();
      if (json?.ok && json.data?.reply) {
        setSessionId(json.data.sessionId);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: json.data.reply.message,
            offers: json.data.reply.recommendedOffers,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "I could not load recommendations yet. Please try again." }]);
      }
    });
  }

  function captureLead() {
    const value = email.trim();
    if (!value) return;

    startTransition(async () => {
      const res = await fetch("/api/assistant/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageId, sessionId: sessionId ?? undefined, email: value, intent: messages.at(-1)?.content }),
      });
      const json = await res.json();
      setLeadStatus(json?.ok ? "Saved. The creator can follow up from their leads table." : "Could not save that email.");
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(calc(100vw-2rem),380px)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_24px_70px_rgba(28,25,23,.22)]">
          <div className="flex items-center justify-between gap-3 bg-stone-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">AI guide</p>
                <p className="truncate text-xs text-white/60">Published offers only</p>
              </div>
            </div>
            <Badge className="bg-emerald-400 text-stone-950">Safe</Badge>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto bg-stone-100 p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm leading-6",
                  message.role === "visitor" ? "ml-10 bg-stone-950 text-white" : "mr-10 bg-white text-stone-800",
                )}
              >
                {message.content}
                {message.offers?.length ? (
                  <div className="mt-3 space-y-2">
                    {message.offers.map((offer) => (
                      <div key={offer.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                        <p className="text-xs font-black uppercase text-stone-500">{offer.type}</p>
                        <p className="mt-1 font-black text-stone-950">{offer.title}</p>
                        {offer.description ? <p className="mt-1 text-xs text-stone-500">{offer.description}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder="Ask what to buy or book"
                className="min-w-0 flex-1 rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-stone-200"
              />
              <Button size="icon" onClick={sendMessage} disabled={isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email for follow-up"
                className="min-w-0 flex-1 rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold outline-none focus:ring-4 focus:ring-stone-200"
              />
              <Button size="icon" variant="secondary" onClick={captureLead} disabled={isPending}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            {leadStatus ? <p className="mt-2 text-xs font-semibold text-stone-500">{leadStatus}</p> : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-white shadow-[0_18px_40px_rgba(28,25,23,.28)] transition hover:-translate-y-0.5"
        aria-label="Open AI guide"
      >
        {open ? <Sparkles className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
