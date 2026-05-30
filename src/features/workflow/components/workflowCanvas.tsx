"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  LayoutGrid,
  Loader2,
  MessageSquareText,
  Mic,
  Monitor,
  Pause,
  Play,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, cn } from "@/components/ui";

type RunState = "idle" | "running" | "paused" | "complete";
type ViewMode = "sources" | "agents" | "kanban" | "timeline" | "findings";
type SidebarTab = "sources" | "log";

type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  sourceType: string;
};

type ResearchAgent = {
  name: string;
  desk: string;
  task: string;
  status: "queued" | "reading" | "synthesizing" | "done";
};

type ResearchResult = {
  title: string;
  summary: string;
  findings: string[];
  sourceQueries: string[];
  sourceQueue: ResearchSource[];
  agents: ResearchAgent[];
  kanban: Record<"collect" | "read" | "synthesize" | "publish", string[]>;
  timeline: Array<{ label: string; detail: string }>;
};

const spritePath = "/creator-office/sprites";

const initialResearch: ResearchResult = {
  title: "Research Office: creator offer demand",
  summary: "KOffice is ready to collect web source leads, assign research agents, cluster findings, and turn research into creator actions.",
  findings: [
    "Use source-backed audience language before writing landing page copy.",
    "Separate market facts, creator opinions, and buyer objections.",
    "Turn every insight into a content angle, offer test, or outreach task.",
  ],
  sourceQueries: [
    "creator offer demand trends",
    "digital product buyer pain points",
    "creator economy audience research",
    "membership retention creator examples",
  ],
  sourceQueue: [
    {
      title: "Creator economy market overview",
      url: "https://en.wikipedia.org/wiki/Creator_economy",
      snippet: "Source lead for market language, definitions, and adjacent topics.",
      sourceType: "Wikipedia",
    },
    {
      title: "Hacker News creator tools discussions",
      url: "https://hn.algolia.com/?q=creator%20tools",
      snippet: "Discussion lead for tool fatigue, pricing, and workflow objections.",
      sourceType: "Hacker News",
    },
  ],
  agents: [
    { name: "Scout", desk: "Source Desk", task: "Collect public web leads", status: "reading" },
    { name: "Analyst", desk: "Trend Room", task: "Cluster claims and objections", status: "queued" },
    { name: "Audience", desk: "Audience Lab", task: "Translate research into pain points", status: "queued" },
    { name: "Editor", desk: "Synthesis Room", task: "Draft creator-ready brief", status: "queued" },
  ],
  kanban: {
    collect: ["Search source leads", "Queue competitor pages"],
    read: ["Scan public discussions", "Extract repeated terms"],
    synthesize: ["Cluster objections", "Map creator actions"],
    publish: ["Research brief", "Content angles", "Offer experiments"],
  },
  timeline: [
    { label: "00:00", detail: "Open the source queue" },
    { label: "02:00", detail: "Read top source leads" },
    { label: "06:00", detail: "Cluster audience pain points" },
    { label: "10:00", detail: "Write creator action brief" },
  ],
};

const floors = [
  { id: "web", name: "Web Source Floor", room: "Source Desk", icon: Globe2, accent: "bg-sky-500" },
  { id: "audience", name: "Audience Lab", room: "Audience Lab", icon: Users, accent: "bg-emerald-500" },
  { id: "trend", name: "Trend Room", room: "Trend Room", icon: BarChart3, accent: "bg-amber-500" },
  { id: "interview", name: "Interview Room", room: "Interview Room", icon: Mic, accent: "bg-violet-500" },
  { id: "synthesis", name: "Synthesis Room", room: "Synthesis Room", icon: FileText, accent: "bg-rose-500" },
];

const modes: Array<{ id: ViewMode; label: string; icon: typeof Globe2 }> = [
  { id: "sources", label: "Sources", icon: Globe2 },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "findings", label: "Findings", icon: BookOpen },
];

function OfficeSprite({ src, className, alt = "" }: { src: string; className?: string; alt?: string }) {
  return <img src={`${spritePath}/${src}`} alt={alt} className={cn("pointer-events-none select-none object-contain", className)} />;
}

function agentPosition(index: number) {
  return [
    { left: 16, top: 55 },
    { left: 39, top: 49 },
    { left: 64, top: 55 },
    { left: 28, top: 72 },
    { left: 55, top: 72 },
    { left: 79, top: 68 },
  ][index % 6];
}

function statusTone(status: ResearchAgent["status"]) {
  if (status === "done") return "border-emerald-300 bg-emerald-50 text-emerald-950";
  if (status === "reading") return "border-sky-300 bg-sky-50 text-sky-950";
  if (status === "synthesizing") return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-stone-200 bg-white text-stone-900";
}

function Whiteboard({
  mode,
  research,
  activeStep,
}: {
  mode: ViewMode;
  research: ResearchResult;
  activeStep: number;
}) {
  if (mode === "sources") {
    return (
      <div className="space-y-1.5 text-[9px]">
        {research.sourceQueue.slice(0, 4).map((source) => (
          <p key={source.url} className="truncate rounded bg-sky-50 px-2 py-1 font-bold text-sky-950">
            {source.sourceType}: {source.title}
          </p>
        ))}
      </div>
    );
  }

  if (mode === "agents") {
    return (
      <div className="grid grid-cols-2 gap-2 text-[9px]">
        {research.agents.slice(0, 4).map((agent) => (
          <div key={agent.name} className="rounded bg-stone-100 p-2">
            <p className="font-black text-stone-900">{agent.name}</p>
            <p className="truncate text-stone-500">{agent.status}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "kanban") {
    return (
      <div className="grid grid-cols-4 gap-1 text-[8px]">
        {Object.entries(research.kanban).map(([column, cards]) => (
          <div key={column} className="rounded bg-stone-100 p-1.5">
            <p className="mb-1 font-black uppercase text-stone-500">{column}</p>
            {cards.slice(0, 2).map((card) => (
              <p key={card} className="mb-1 truncate rounded bg-white px-1 py-0.5 font-bold text-stone-700">{card}</p>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (mode === "timeline") {
    return (
      <div className="space-y-1.5 text-[9px]">
        {research.timeline.slice(0, 5).map((item, index) => (
          <div key={`${item.label}-${item.detail}`} className="flex items-center gap-2">
            <span className={cn("grid h-5 w-9 place-items-center rounded-full text-[8px] font-black", index === activeStep ? "bg-emerald-600 text-white" : "bg-stone-900 text-white")}>{item.label}</span>
            <span className="truncate font-bold text-stone-700">{item.detail}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-[9px]">
      {research.findings.slice(0, 4).map((finding) => (
        <p key={finding} className="truncate rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-950">{finding}</p>
      ))}
    </div>
  );
}

export function WorkflowCanvas() {
  const [research, setResearch] = useState<ResearchResult>(initialResearch);
  const [query, setQuery] = useState("What AI tools and offers are creators buying in 2026, and what pain points show up in public discussions?");
  const [audience, setAudience] = useState("solo creators, coaches, and creator-led SaaS founders");
  const [angle, setAngle] = useState("creator product opportunities");
  const [activeFloor, setActiveFloor] = useState("web");
  const [mode, setMode] = useState<ViewMode>("sources");
  const [tab, setTab] = useState<SidebarTab>("sources");
  const [runState, setRunState] = useState<RunState>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("Public sources");
  const [toast, setToast] = useState<string | null>(null);

  const activeFloorMeta = floors.find((floor) => floor.id === activeFloor) ?? floors[0];
  const activeAgent = research.agents[activeStep % Math.max(1, research.agents.length)];
  const totalCards = useMemo(
    () => Object.values(research.kanban).reduce((sum, cards) => sum + cards.length, 0),
    [research.kanban]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  async function runResearch() {
    if (!query.trim()) return;
    setLoading(true);
    setRunState("running");
    setActiveStep(0);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, audience, angle }),
      });
      const json = await res.json();
      if (!json.ok) {
        showToast(json.error?.message ?? "Research run failed");
        setRunState("idle");
        return;
      }

      setResearch(json.data.research);
      setProvider(json.data.available ? "Gemini synthesis" : "Public sources");
      setMode("sources");
      showToast("Research office loaded new source queue");
    } catch {
      showToast("Network error while running research");
      setRunState("idle");
    } finally {
      setLoading(false);
    }
  }

  function toggleRun() {
    if (runState === "running") {
      setRunState("paused");
      return;
    }
    if (runState === "complete") setActiveStep(0);
    setRunState("running");
  }

  useEffect(() => {
    if (runState !== "running") return undefined;
    const maxSteps = Math.max(research.timeline.length, research.agents.length, 1);
    const timer = window.setInterval(() => {
      setActiveStep((step) => {
        if (step >= maxSteps - 1) {
          setRunState("complete");
          return step;
        }
        return step + 1;
      });
    }, 1300);

    return () => window.clearInterval(timer);
  }, [runState, research.timeline.length, research.agents.length]);

  return (
    <div className="relative">
      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-stone-950 px-4 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[260px_1fr_340px]">
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">KOffice building</p>
            <p className="text-sm font-semibold text-foreground">Web Research HQ</p>
          </div>
          <div className="space-y-3 p-3">
            {floors.map((floor, index) => {
              const Icon = floor.icon;
              const active = activeFloor === floor.id;
              return (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloor(floor.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
                    active ? "border-stone-900 bg-stone-950 text-white" : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("grid h-9 w-9 place-items-center rounded-md text-white", floor.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{index + 5}F {floor.name}</span>
                    <span className={cn("block truncate text-xs", active ? "text-white/55" : "text-muted-foreground")}>{floor.room}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Research prompt</p>
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-black text-muted-foreground">{provider}</span>
              </div>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ring/20"
              />
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input value={audience} onChange={(event) => setAudience(event.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold outline-none" placeholder="Audience" />
                <input value={angle} onChange={(event) => setAngle(event.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold outline-none" placeholder="Research angle" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:justify-end">
              <button
                onClick={runResearch}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-xs font-black text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Research web
              </button>
              <button onClick={toggleRun} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-xs font-black text-white transition hover:bg-stone-800">
                {runState === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {runState === "running" ? "Pause office" : "Run office"}
              </button>
            </div>
          </div>

          <div className="relative min-h-[640px] overflow-hidden bg-[#1b1d25]">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#11131b] to-[#303648]" />
            <div className="absolute left-8 top-7 hidden h-20 w-36 rounded-lg border-4 border-[#6d543f] bg-[#8fd0ff] shadow-inner md:block" />
            <div className="absolute right-8 top-5 hidden h-24 w-72 rounded-lg border-4 border-[#6d543f] bg-stone-100 p-3 md:block">
              <Whiteboard mode={mode} research={research} activeStep={activeStep} />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[78%] bg-[#705a46] [background-image:linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="absolute left-4 top-32 z-30 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
              {modes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-black transition",
                      mode === item.id ? "border-white bg-white text-stone-950" : "border-white/20 bg-black/20 text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-8 left-1/2 z-10 h-[395px] w-[940px] max-w-[96%] -translate-x-1/2 rounded-[18px] border border-black/20 bg-black/10 shadow-2xl">
              <div className="absolute left-[7%] top-[12%] rounded-md bg-stone-900 px-3 py-1 text-xs font-black text-white shadow-lg">
                {activeFloorMeta.room}
              </div>
              <OfficeSprite src="plant.png" className="absolute bottom-10 left-5 h-24" />
              <OfficeSprite src="watercooler.png" className="absolute bottom-10 right-8 h-28" />
              <OfficeSprite src="old-printer.png" className="absolute bottom-8 left-[32%] h-16" />
              <OfficeSprite src="coffee-machine.png" className="absolute bottom-8 right-[28%] h-16" />

              {research.agents.map((agent, index) => {
                const position = agentPosition(index);
                const active = index === activeStep % Math.max(1, research.agents.length) && runState === "running";
                return (
                  <div key={agent.name} className="absolute z-20 w-40 -translate-x-1/2 text-left transition duration-200" style={{ left: `${position.left}%`, top: `${position.top}%` }}>
                    <div className={cn("rounded-lg border px-3 py-2 shadow-lg", statusTone(active ? "reading" : agent.status), active && "ring-2 ring-emerald-400")}>
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-white/80 ring-1 ring-black/5">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black">{agent.name}</p>
                          <p className="truncate text-[9px] font-bold opacity-60">{agent.task}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mx-auto mt-1 h-10 w-16">
                      <OfficeSprite src="desk.png" className="h-full w-full" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-30 grid gap-2 md:grid-cols-3">
              {[
                { label: "Source leads", value: research.sourceQueue.length, icon: Globe2 },
                { label: "Research cards", value: totalCards, icon: LayoutGrid },
                { label: "Active agent", value: activeAgent?.name ?? "Scout", icon: Monitor },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white backdrop-blur">
                  <stat.icon className="h-4 w-4 text-emerald-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Research brief</p>
                <p className="text-sm font-semibold text-foreground">{research.title}</p>
              </div>
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{research.summary}</p>
            <div className="mt-4 space-y-2">
              {research.findings.slice(0, 5).map((finding) => (
                <div key={finding} className="flex gap-2 rounded-md bg-secondary/60 p-2 text-xs font-semibold text-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex border-b border-border bg-secondary/60">
              <button onClick={() => setTab("sources")} className={cn("flex-1 px-3 py-2 text-xs font-black uppercase tracking-[0.12em]", tab === "sources" ? "bg-card text-foreground" : "text-muted-foreground")}>
                Sources
              </button>
              <button onClick={() => setTab("log")} className={cn("flex-1 px-3 py-2 text-xs font-black uppercase tracking-[0.12em]", tab === "log" ? "bg-card text-foreground" : "text-muted-foreground")}>
                Log
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 preview-scroll">
              {tab === "sources" ? (
                <div className="space-y-3">
                  {research.sourceQueue.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border bg-background p-3 transition hover:bg-secondary/60">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black text-foreground">{source.title}</p>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-accent">{source.sourceType}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.snippet || "Open source lead for review."}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {research.timeline.map((item, index) => (
                    <div key={`${item.label}-${item.detail}`} className={cn("flex gap-3 rounded-lg p-2", index === activeStep ? "bg-emerald-50" : "")}>
                      <span className={cn("grid h-7 w-12 place-items-center rounded-full text-[10px] font-black", index < activeStep || runState === "complete" ? "bg-emerald-600 text-white" : index === activeStep && runState === "running" ? "bg-amber-500 text-white" : "bg-secondary")}>{item.label}</span>
                      <div>
                        <p className="text-sm font-black text-foreground">{item.detail}</p>
                        <p className="text-xs text-muted-foreground">{index === activeStep && runState === "running" ? "running" : index < activeStep || runState === "complete" ? "complete" : "queued"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
