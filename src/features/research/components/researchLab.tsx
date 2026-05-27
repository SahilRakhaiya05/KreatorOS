"use client";

import { useState } from "react";
import { researchStudies } from "@/shared/mock/data";
import { Badge, Card, cn } from "@/components/ui";
import { Calendar, FileText, Languages, Mic, Send, Sparkles, Upload, Users, Video } from "lucide-react";

export function ResearchLab() {
  const [selected, setSelected] = useState(researchStudies[0]);
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between"><p className="font-black text-slate-950">Research projects</p><Badge tone="violet">Askiva-inspired</Badge></div>
        <div className="space-y-3">
          {researchStudies.map(study => <button key={study.name} onClick={() => setSelected(study)} className={cn("w-full rounded-2xl border p-4 text-left", selected.name === study.name ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-slate-50 hover:bg-white")}><div className="flex items-center justify-between"><p className="font-black text-slate-950">{study.name}</p><Badge tone={study.status === "Completed" ? "green" : study.status === "Running" ? "blue" : "amber"}>{study.status}</Badge></div><p className="mt-2 text-sm text-slate-500">{study.completed}/{study.participants} interviews · {study.language}</p></button>)}
        </div>
      </Card>
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-violet-600">Automated customer research</p><h2 className="mt-2 text-2xl font-black text-slate-950">{selected.name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">AI can import customers, localize outreach, schedule interviews, join Zoom/Meet, ask adaptive questions, transcribe, summarize themes, extract quotes, and push product decisions into the AI operator.</p></div><button className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Launch study</button></div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              [Upload, "Import", "CSV/customers"],
              [Send, "Outreach", "Personalized"],
              [Calendar, "Schedule", "Timezone-aware"],
              [Video, "Interview", "AI moderated"],
              [FileText, "Insights", "Themes + quotes"],
            ].map(([Icon, title, text]) => <div key={String(title)} className="rounded-2xl bg-slate-50 p-4"><Icon className="mb-3 h-5 w-5 text-violet-600" /><p className="text-sm font-black">{String(title)}</p><p className="text-xs text-slate-500">{String(text)}</p></div>)}
          </div>
        </Card>
        <Card className="p-5">
          <p className="font-black text-slate-950">Insight board</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {["Top objection", "Winning language", "New offer idea"].map((item, index) => <div key={item} className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200"><Badge tone={["rose", "green", "violet"][index] as any}>{item}</Badge><p className="mt-4 text-sm leading-6 text-slate-700">{index === 0 ? "Customers need proof before paying for a high-ticket audit." : index === 1 ? "They react best to 'AI business system' over 'prompt templates'." : "Add a $19 async video audit as low-friction entry."}</p></div>)}
          </div>
          <div className="mt-5 rounded-2xl bg-mint p-4"><p className="flex items-center gap-2 text-sm font-black text-emerald-950"><Sparkles className="h-4 w-4" /> AI action</p><p className="mt-2 text-sm leading-6 text-emerald-900">Create a low-ticket async audit offer, place it above the $149 audit, and run a 14-day A/B test.</p></div>
        </Card>
      </div>
    </div>
  );
}
