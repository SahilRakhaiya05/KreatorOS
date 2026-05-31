"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Sparkles, Wand2, Workflow, ShieldCheck, Database, PlayCircle } from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { analyticsEvents, captureClientEvent } from "@/client/posthog/events";

const starters = [
  "Create my full creator business page",
  "Build a paid booking funnel with routing",
  "Create a product bundle and upsell workflow",
  "Set up brand collab campaign workflow",
  "Interview my customers and summarize insights",
  "Make an agent that manages client support"
];

const toolPlan = [
  { tool: "read_workspace_graph", label: "Read workspace knowledge", icon: Database },
  { tool: "draft_records", label: "Draft products, pages, calendar rules", icon: Wand2 },
  { tool: "policy_check", label: "Check permissions and risks", icon: ShieldCheck },
  { tool: "approval_queue", label: "Ask creator to approve actions", icon: CheckCircle2 },
  { tool: "execute_workflow", label: "Run automation after approval", icon: PlayCircle },
];

export function AIOperator({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState([
    { role: "agent", text: "I am your KreatorOS operator. I know your products, bookings, customers, members, brand deals, automations, and analytics. Tell me the outcome, not the steps." },
    { role: "user", text: "Build a paid booking funnel for high-intent visitors and brand companies." },
    { role: "agent", text: "Draft created: routing form, two booking types, Stripe payment rule, brand discovery call, WhatsApp/email reminders, calendar events, follow-up drafts, and analytics goals. Approval needed before publishing." }
  ]);
  const [input, setInput] = useState("");

  function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    
    // Capture AI Operator execution event in PostHog
    captureClientEvent(analyticsEvents.operatorRunStarted, { prompt: value });

    setMessages(prev => [...prev, { role: "user", text: value }, { role: "agent", text: `I prepared a safe execution plan for: ${value}. I created drafts, checked policies, and added actions to the approval queue.` }]);
    setInput("");
  }

  return (
    <Card className={cn("overflow-hidden", compact ? "" : "min-h-[680px]")}>
      <div className="border-b border-slate-200 bg-slate-950 p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3"><Bot className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-black">Custom AI Operator</h2>
              <p className="text-sm text-slate-300">App-native agent with tool access, memory, approvals, and audit logs.</p>
            </div>
          </div>
          <Badge tone="green">Guarded tool-calling</Badge>
        </div>
      </div>
      <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="h-[420px] space-y-3 overflow-y-auto bg-slate-50 p-5">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[82%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 shadow-sm", msg.role === "user" ? "bg-violet-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200")}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {starters.map(item => <button key={item} onClick={() => send(item)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">{item}</button>)}
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200" placeholder="Example: create a webinar funnel with paid VIP calls and follow-up emails" />
              <button onClick={() => send()} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Run</button>
            </div>
          </div>
        </div>
        <div className="border-l border-slate-200 bg-white p-5">
          <p className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950"><Workflow className="h-4 w-4" /> Execution model</p>
          <div className="space-y-3">
            {toolPlan.map((step, index) => {
              const Icon = step.icon;
              return <div key={step.tool} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 ring-1 ring-slate-200"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-black text-slate-950">{index + 1}. {step.label}</p><p className="text-xs text-slate-500">{step.tool}</p></div></div></div>;
            })}
          </div>
          <div className="mt-5 rounded-2xl bg-lavender p-4">
            <p className="flex items-center gap-2 text-sm font-black text-violet-950"><Sparkles className="h-4 w-4" /> Why this is different</p>
            <p className="mt-2 text-sm leading-6 text-violet-900">The agent is not a generic chat screen. It has structured tools, app memory, approval checkpoints, and can create real records in your database after consent.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
