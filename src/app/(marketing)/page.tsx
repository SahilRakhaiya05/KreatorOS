import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calendar,
  Handshake,
  Link as LinkIcon,
  Mic,
  ShieldCheck,
  Sparkles,
  Workflow,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const pillars = [
  { icon: Bot, title: "Custom AI Operator", text: "A supervised agent that knows every product, booking, customer, workflow, and brand deal — and acts only after your approval." },
  { icon: LinkIcon, title: "Dynamic bio + store", text: "Not static links. Every block can sell, route, gate, schedule, upsell, and trigger automations." },
  { icon: Calendar, title: "Booking intelligence", text: "Cal.com-style routing, paid meetings, recurring sessions, reminders, and AI follow-ups." },
  { icon: Workflow, title: "Workflow canvas", text: "Node-based trigger/action editor for AI agents, payments, messages, calendar, CRM, and research loops." },
  { icon: Mic, title: "Research autopilot", text: "Customer interviews, outreach, scheduling, AI moderation, transcript themes, and prioritized insights." },
  { icon: Handshake, title: "Brand collaboration", text: "Brand workspace, creator discovery, proposals, collab rooms, deliverables, payments, and reports." },
];

const steps = [
  { n: "01", title: "Connect your workspace", text: "Bring your audience, offers, and calendar. The operator reads your business graph." },
  { n: "02", title: "Describe the outcome", text: "Tell the agent a goal in plain language. It returns a sequenced, approvable plan." },
  { n: "03", title: "Approve and automate", text: "Review drafts, approve, and let workflows run bookings, payments, and follow-ups." },
];

const stats = [
  { value: "$18.4k", label: "Avg. monthly revenue" },
  { value: "148", label: "Bookings / month" },
  { value: "1,280", label: "Customers reached" },
  { value: "12 min", label: "To launch a funnel" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">KreatorOS</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#how" className="transition hover:text-foreground">How it works</a>
            <a href="#pricing" className="transition hover:text-foreground">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="dotted-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
          <div className="animate-fade-up">
            <Badge variant="accent" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> The creator monetization autopilot
            </Badge>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance md:text-7xl">
              The AI operating system for creator businesses.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              KreatorOS turns a bio link into a living business graph — store, paid calls, memberships,
              courses, brand deals, research interviews, and AI-run workflows.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">Launch your workspace <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/creator/chat">Try the AI chat</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["bg-chart-1", "bg-chart-3", "bg-chart-4", "bg-chart-2"].map((c) => (
                  <span key={c} className={`h-7 w-7 rounded-full ring-2 ring-background ${c}`} />
                ))}
              </div>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Loved by 2,000+ creators
              </span>
            </div>
          </div>

          {/* Product preview */}
          <Card className="animate-fade-up overflow-hidden border-border/80 p-2 shadow-card [animation-delay:120ms]">
            <div className="rounded-lg bg-primary p-5 text-primary-foreground">
              <div className="flex items-center justify-between">
                <Badge variant="success" className="gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live agent run
                </Badge>
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="mt-5 space-y-2.5">
                {["Read creator business graph", "Create page, offers + booking routes", "Set payment and calendar rules", "Draft WhatsApp / email workflows", "Ask for approval before publish"].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white/15 font-mono text-xs">{i + 1}</span>
                    <p className="text-sm font-medium">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg bg-card p-4 text-card-foreground">
                <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent" /> AI recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Add a $19 async audit, route brands to a free discovery call, and interview non-buyers automatically.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="px-2 py-10 text-center">
              <p className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline">Everything in one operator</Badge>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance">
            One workspace for the whole creator business.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop stitching together six tools. KreatorOS unifies monetization, scheduling, research, and brand deals under a supervised AI operator.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="group p-6 transition hover:-translate-y-1 hover:shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline">How it works</Badge>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">From goal to automation in three steps.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} className="p-7">
                <p className="font-mono text-sm font-semibold text-accent">{s.n}</p>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <Card className="relative overflow-hidden bg-primary p-12 text-center text-primary-foreground md:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Run your creator business on autopilot.</h2>
            <p className="mt-4 text-primary-foreground/70">Start free. Connect your audience, describe a goal, and watch the operator build it.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/login">Get started free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link href="/creator">View live demo</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/70">
              {["No credit card", "Cancel anytime", "Human-in-the-loop approvals"].map((f) => (
                <li key={f} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> {f}</li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-foreground">KreatorOS</span>
          </div>
          <p>© {new Date().getFullYear()} KreatorOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
