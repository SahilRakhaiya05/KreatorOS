import { ArrowRight, Bot, Calendar, Handshake, Link as LinkIcon, Mic, PlayCircle, ShieldCheck, Sparkles, Store, Workflow } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";

const pillars = [
  [Bot, "Custom AI Operator", "A supervised agent that knows every product, booking, customer, workflow, brand deal, and page block."],
  [LinkIcon, "Dynamic bio + store", "Not static links. Every block can sell, route, gate, schedule, upsell, and trigger automations."],
  [Calendar, "Booking intelligence", "Calendly/Cal.com-style routing, paid meetings, recurring sessions, reminders, and follow-ups."],
  [Workflow, "Workflow canvas", "Node-based trigger/action editor for AI agents, payments, messages, calendar, CRM, and research loops."],
  [Mic, "Research autopilot", "Askiva-inspired customer interviews, outreach, scheduling, AI moderation, transcript themes, and insights."],
  [Handshake, "Brand collaboration", "Brand workspace, creator discovery, proposals, collaboration rooms, deliverables, payments, and reports."],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen askiva-grid">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white"><Sparkles className="h-5 w-5" /></div><div><p className="font-black">KreatorOS AI</p><p className="text-xs font-semibold text-slate-500">AI business operator</p></div></div>
        <div className="hidden items-center gap-2 md:flex"><ButtonLink href="/login" variant="light">Login</ButtonLink><ButtonLink href="/creator">Open app</ButtonLink></div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <Badge tone="violet">YC-grade wedge: creator monetization autopilot</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">The AI operating system for creator businesses.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">KreatorOS turns a creator's bio link into a dynamic business graph: store, paid calls, memberships, courses, brand deals, research interviews, client portals, and AI-run workflows.</p>
          <div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/creator">Launch creator workspace</ButtonLink><ButtonLink href="/brand" variant="light">View brand workspace</ButtonLink></div>
        </div>
        <Card className="overflow-hidden p-4">
          <div className="rounded-[2rem] bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between"><Badge tone="green">Live agent run</Badge><ShieldCheck className="h-5 w-5 text-emerald-300" /></div>
            <div className="mt-5 space-y-3">
              {["Read creator business graph", "Create page + offers + booking routes", "Set payment and calendar rules", "Draft WhatsApp/email workflows", "Ask for approval before publish"].map((step, i) => <div key={step} className="rounded-2xl bg-white/10 p-4"><p className="text-sm font-black">{i + 1}. {step}</p></div>)}
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950"><p className="font-black">AI recommendation</p><p className="mt-1 text-sm leading-6 text-slate-600">Add a $19 async audit, route brands to a free discovery call, and interview non-buyers automatically.</p></div>
          </div>
        </Card>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map(([Icon, title, text]) => <Card key={String(title)} className="p-6"><Icon className="mb-4 h-6 w-6 text-violet-600" /><h3 className="text-lg font-black">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{String(text)}</p></Card>)}
        </div>
      </section>
    </main>
  );
}
