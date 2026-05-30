"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Globe2,
  LayoutGrid,
  Loader2,
  Mic,
  Monitor,
  Pause,
  Play,
  Radio,
  Save,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, cn } from "@/components/ui";

type RunState = "idle" | "running" | "paused" | "complete";
type ViewMode = "office" | "sources" | "agents" | "kanban" | "timeline" | "findings";
type SidebarTab = "sources" | "log" | "brief";

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

type KOfficeRun = {
  id: string;
  query: string;
  audience?: string | null;
  angle?: string | null;
  provider: string;
  status: "queued" | "running" | "complete" | "failed";
  active_step: number;
  research: ResearchResult;
  source_queue: ResearchSource[];
  agents: ResearchAgent[];
  kanban: ResearchResult["kanban"];
  timeline: ResearchResult["timeline"];
  final_answer?: string | null;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
};

const spritePath = "/creator-office/sprites";

const emptyResearch: ResearchResult = {
  title: "No KOffice run selected",
  summary: "Start a research run to deploy agents, collect source leads, and store a final answer in your workspace database.",
  findings: [],
  sourceQueries: [],
  sourceQueue: [],
  agents: [],
  kanban: {
    collect: [],
    read: [],
    synthesize: [],
    publish: [],
  },
  timeline: [],
};

const floors = [
  { id: "building", name: "Command Lobby", room: "Office Map", icon: Building2, accent: "bg-stone-950", objective: "route every run" },
  { id: "web", name: "Source Floor", room: "Source Desk", icon: Globe2, accent: "bg-sky-600", objective: "collect public leads" },
  { id: "audience", name: "Audience Lab", room: "Pain Point Pods", icon: Users, accent: "bg-emerald-600", objective: "translate demand" },
  { id: "trend", name: "Trend Room", room: "Signal Wall", icon: BarChart3, accent: "bg-amber-600", objective: "score patterns" },
  { id: "interview", name: "Interview Room", room: "Question Bank", icon: Mic, accent: "bg-violet-600", objective: "prepare asks" },
  { id: "synthesis", name: "Synthesis Room", room: "Brief Printer", icon: FileText, accent: "bg-rose-600", objective: "ship actions" },
];

const modes: Array<{ id: ViewMode; label: string; icon: typeof Globe2 }> = [
  { id: "office", label: "Office", icon: Building2 },
  { id: "sources", label: "Sources", icon: Globe2 },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "findings", label: "Findings", icon: BookOpen },
];

const statusLabels: Record<ResearchAgent["status"], string> = {
  queued: "Queued",
  reading: "Reading",
  synthesizing: "Synthesizing",
  done: "Done",
};

function OfficeSprite({ src, className, alt = "" }: { src: string; className?: string; alt?: string }) {
  return <img src={`${spritePath}/${src}`} alt={alt} className={cn("pointer-events-none select-none object-contain", className)} />;
}

function agentPosition(index: number) {
  return [
    { left: 15, top: 52 },
    { left: 35, top: 45 },
    { left: 59, top: 52 },
    { left: 79, top: 44 },
    { left: 26, top: 71 },
    { left: 50, top: 70 },
    { left: 72, top: 70 },
    { left: 87, top: 64 },
  ][index % 8];
}

function statusTone(status: ResearchAgent["status"]) {
  if (status === "done") return "border-emerald-300 bg-emerald-50 text-emerald-950";
  if (status === "reading") return "border-sky-300 bg-sky-50 text-sky-950";
  if (status === "synthesizing") return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-stone-200 bg-white text-stone-900";
}

function nextAgentStatus(agent: ResearchAgent, index: number, activeStep: number, runState: RunState): ResearchAgent["status"] {
  if (runState === "complete" || index < activeStep) return "done";
  if (runState === "running" && index === activeStep) return index % 2 ? "synthesizing" : "reading";
  return agent.status === "done" ? "done" : "queued";
}

function Whiteboard({ mode, research, activeStep }: { mode: ViewMode; research: ResearchResult; activeStep: number }) {
  if (mode === "sources" || mode === "office") {
    return (
      <div className="space-y-1.5 text-[9px]">
        {research.sourceQueue.slice(0, 4).map((source) => (
          <p key={source.url} className="truncate rounded bg-sky-50 px-2 py-1 font-black text-sky-950">
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
            <p className="truncate text-stone-500">{agent.desk}</p>
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
              <p key={card} className="mb-1 truncate rounded bg-white px-1 py-0.5 font-bold text-stone-700">
                {card}
              </p>
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
            <span className={cn("grid h-5 w-9 place-items-center rounded-full text-[8px] font-black", index === activeStep ? "bg-emerald-600 text-white" : "bg-stone-900 text-white")}>
              {item.label}
            </span>
            <span className="truncate font-bold text-stone-700">{item.detail}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-[9px]">
      {research.findings.slice(0, 4).map((finding) => (
        <p key={finding} className="truncate rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-950">
          {finding}
        </p>
      ))}
    </div>
  );
}

function ProgressBar({ value, tone = "bg-emerald-500" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/15">
      <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function MiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-16 items-end gap-1">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex-1 rounded-t bg-emerald-500/80" style={{ height: `${Math.max(14, (value / max) * 64)}px` }} />
      ))}
    </div>
  );
}

function buildBrief(research: ResearchResult) {
  return [
    research.title,
    "",
    research.summary,
    "",
    "Findings:",
    ...research.findings.map((finding) => `- ${finding}`),
    "",
    "Source leads:",
    ...research.sourceQueue.map((source) => `- ${source.title} (${source.sourceType}) ${source.url}`),
    "",
    "Next actions:",
    ...Object.entries(research.kanban).flatMap(([column, cards]) => cards.map((card) => `- ${column}: ${card}`)),
  ].join("\n");
}

function plannedResearch(query: string, audience: string, angle: string): ResearchResult {
  const subject = query.trim() || "creator research request";
  return {
    title: `KOffice run: ${subject}`,
    summary: `KOffice is deciding the route for ${audience || "this creator audience"}${angle ? ` with a ${angle} angle` : ""}. Agents are being deployed now.`,
    findings: [],
    sourceQueries: [
      `${subject} market trends`,
      `${subject} audience pain points`,
      `${subject} creator examples`,
    ],
    sourceQueue: [],
    agents: [
      { name: "Scout", desk: "Source Desk", task: "Search public source leads", status: "reading" },
      { name: "Analyst", desk: "Trend Room", task: "Score repeated signals and objections", status: "queued" },
      { name: "Audience", desk: "Audience Lab", task: "Translate signals into buyer language", status: "queued" },
      { name: "Editor", desk: "Synthesis Room", task: "Write the final creator action brief", status: "queued" },
    ],
    kanban: {
      collect: ["Search public sources", "Build source queue"],
      read: ["Read strongest results"],
      synthesize: ["Cluster claims and objections"],
      publish: ["Final answer", "Workflow draft"],
    },
    timeline: [
      { label: "00:00", detail: "Deploy source scout" },
      { label: "00:15", detail: "Collect public source leads" },
      { label: "00:45", detail: "Dispatch analyst and audience agent" },
      { label: "01:15", detail: "Write final answer" },
    ],
  };
}

function researchFromRun(run: KOfficeRun): ResearchResult {
  return {
    ...emptyResearch,
    ...(run.research || {}),
    sourceQueue: run.source_queue?.length ? run.source_queue : run.research?.sourceQueue ?? [],
    agents: run.agents?.length ? run.agents : run.research?.agents ?? [],
    kanban: run.kanban && Object.keys(run.kanban).length ? run.kanban : run.research?.kanban ?? emptyResearch.kanban,
    timeline: run.timeline?.length ? run.timeline : run.research?.timeline ?? [],
  };
}

export function WorkflowCanvas() {
  const [research, setResearch] = useState<ResearchResult>(emptyResearch);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("");
  const [angle, setAngle] = useState("");
  const [runHistory, setRunHistory] = useState<KOfficeRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [activeFloor, setActiveFloor] = useState("web");
  const [mode, setMode] = useState<ViewMode>("office");
  const [tab, setTab] = useState<SidebarTab>("sources");
  const [runState, setRunState] = useState<RunState>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [provider, setProvider] = useState("Workspace DB");
  const [toast, setToast] = useState<string | null>(null);

  const activeFloorMeta = floors.find((floor) => floor.id === activeFloor) ?? floors[1];
  const activeAgent = research.agents[activeStep % Math.max(1, research.agents.length)];
  const totalCards = useMemo(() => Object.values(research.kanban).reduce((sum, cards) => sum + cards.length, 0), [research.kanban]);
  const completedSteps = runState === "complete" ? research.timeline.length : Math.min(activeStep, research.timeline.length);
  const signalValues = useMemo(
    () => [
      research.sourceQueue.length + 2,
      research.findings.length + 1,
      research.kanban.collect.length + research.kanban.read.length,
      research.kanban.synthesize.length + 2,
      research.kanban.publish.length + 1,
    ],
    [research]
  );
  const brief = useMemo(() => finalAnswer || buildBrief(research), [finalAnswer, research]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  async function runResearch() {
    if (!query.trim()) return;
    setLoading(true);
    setRunState("running");
    setActiveStep(0);
    setFinalAnswer("");
    setResearch(plannedResearch(query, audience, angle));
    setProvider("Deploying agents");

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

      const savedRun = json.data.run as KOfficeRun | undefined;
      setResearch(json.data.research);
      setFinalAnswer(json.data.finalAnswer ?? savedRun?.final_answer ?? "");
      if (savedRun) {
        setActiveRunId(savedRun.id);
        setRunHistory((runs) => [savedRun, ...runs.filter((run) => run.id !== savedRun.id)].slice(0, 12));
      }
      setProvider(json.data.available ? "Gemini synthesis" : "Public source synthesis");
      setMode("office");
      setTab("sources");
      setActiveStep(0);
      setRunState("running");
      showToast("KOffice saved the run and is presenting the final answer");
    } catch {
      showToast("Network error while running research");
      setRunState("idle");
    } finally {
      setLoading(false);
    }
  }

  function selectRun(run: KOfficeRun) {
    setActiveRunId(run.id);
    setResearch(researchFromRun(run));
    setFinalAnswer(run.final_answer ?? "");
    setProvider(run.provider === "google" ? "Gemini synthesis" : "Public source synthesis");
    setQuery(run.query);
    setAudience(run.audience ?? "");
    setAngle(run.angle ?? "");
    setRunState(run.status === "complete" ? "complete" : run.status === "running" ? "running" : "idle");
    setActiveStep(run.status === "complete" ? Math.max(0, (run.timeline?.length ?? 1) - 1) : run.active_step ?? 0);
    setMode("office");
  }

  function toggleRun() {
    if (runState === "running") {
      setRunState("paused");
      return;
    }
    if (runState === "complete") setActiveStep(0);
    setRunState("running");
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      showToast("Research brief copied");
    } catch {
      showToast("Could not copy brief");
    }
  }

  function downloadBrief() {
    const blob = new Blob([brief], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${research.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "koffice-brief"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Brief downloaded");
  }

  async function saveWorkflow() {
    setSavingWorkflow(true);
    try {
      const nodes = [
        { id: "trigger", type: "source_research", label: "Run source research", data: { query, audience, angle } },
        { id: "collect", type: "source_queue", label: "Collect source leads", data: { sources: research.sourceQueue } },
        { id: "synthesize", type: "agent_team", label: "Synthesize findings", data: { agents: research.agents, findings: research.findings } },
        { id: "publish", type: "approval_task", label: "Create creator actions", data: { kanban: research.kanban } },
      ];
      const edges = [
        { id: "e1", source: "trigger", target: "collect" },
        { id: "e2", source: "collect", target: "synthesize" },
        { id: "e3", source: "synthesize", target: "publish" },
      ];
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `KOffice - ${research.title}`,
          trigger: "koffice.research.requested",
          status: "draft",
          nodes,
          edges,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        showToast(json.error?.message ?? "Workflow save failed");
        return;
      }
      showToast("Workflow draft saved");
    } catch {
      showToast("Could not save workflow");
    } finally {
      setSavingWorkflow(false);
    }
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
    }, 1350);

    return () => window.clearInterval(timer);
  }, [runState, research.timeline.length, research.agents.length]);

  useEffect(() => {
    let cancelled = false;
    async function loadRuns() {
      setLoadingHistory(true);
      try {
        const res = await fetch("/api/ai/research", { method: "GET" });
        const json = await res.json();
        if (!json.ok) {
          showToast(json.error?.message ?? "Could not load KOffice runs");
          return;
        }
        if (cancelled) return;
        const runs = (json.data.runs ?? []) as KOfficeRun[];
        setRunHistory(runs);
        if (runs[0]) selectRun(runs[0]);
      } catch {
        if (!cancelled) showToast("Could not load KOffice history");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }
    loadRuns();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative">
      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-md bg-stone-950 px-4 py-3 text-sm font-black text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-[286px_minmax(0,1fr)_360px]">
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-stone-950 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">KOffice building</p>
                <p className="text-sm font-black text-foreground">Creator Research HQ</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-3">
            {floors.map((floor, index) => {
              const Icon = floor.icon;
              const active = activeFloor === floor.id;
              return (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloor(floor.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
                    active ? "border-stone-950 bg-stone-950 text-white shadow-lg" : "border-border bg-background text-muted-foreground hover:border-stone-300 hover:text-foreground"
                  )}
                >
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md text-white", floor.accent)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{index + 1}F {floor.name}</span>
                    <span className={cn("block truncate text-xs", active ? "text-white/60" : "text-muted-foreground")}>{floor.room}</span>
                  </span>
                  <ChevronRight className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground")} />
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-4">
            <div className="rounded-lg bg-stone-950 p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">Run health</p>
                <Gauge className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold">
                    <span>Sources</span>
                    <span>{research.sourceQueue.length}</span>
                  </div>
                  <ProgressBar value={Math.min(100, research.sourceQueue.length * 12)} tone="bg-sky-400" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold">
                    <span>Brief</span>
                    <span>{research.findings.length} notes</span>
                  </div>
                  <ProgressBar value={Math.min(100, research.findings.length * 14)} tone="bg-emerald-400" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold">
                    <span>Timeline</span>
                    <span>{completedSteps}/{research.timeline.length}</span>
                  </div>
                  <ProgressBar value={(completedSteps / Math.max(1, research.timeline.length)) * 100} tone="bg-amber-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Saved runs</p>
              {loadingHistory ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
            </div>
            <div className="space-y-2">
              {runHistory.length ? (
                runHistory.slice(0, 5).map((run) => (
                  <button
                    key={run.id}
                    onClick={() => selectRun(run)}
                    className={cn(
                      "w-full rounded-md border p-3 text-left transition",
                      activeRunId === run.id ? "border-stone-950 bg-stone-950 text-white" : "border-border bg-background hover:bg-secondary"
                    )}
                  >
                    <p className="truncate text-xs font-black">{run.query}</p>
                    <div className={cn("mt-1 flex items-center justify-between text-[10px] font-bold uppercase", activeRunId === run.id ? "text-white/55" : "text-muted-foreground")}>
                      <span>{run.status}</span>
                      <span>{new Date(run.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-border p-3 text-xs font-semibold leading-5 text-muted-foreground">
                  No saved runs yet. Start research and KOffice will store the run here.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid gap-4 border-b border-border p-4 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Research command</p>
                <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-black text-muted-foreground">{provider}</span>
                <span className={cn("rounded px-2 py-0.5 text-[10px] font-black uppercase", runState === "running" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600")}>
                  {runState}
                </span>
              </div>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tell KOffice what to research..."
                className="min-h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ring/20"
              />
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring/20"
                  placeholder="Audience, e.g. solo creators"
                />
                <input
                  value={angle}
                  onChange={(event) => setAngle(event.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring/20"
                  placeholder="Angle, e.g. offer ideas"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:w-48 xl:flex-col xl:justify-end">
              <button
                onClick={runResearch}
                disabled={loading || !query.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-xs font-black text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Research
              </button>
              <button onClick={toggleRun} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-xs font-black text-white transition hover:bg-stone-800">
                {runState === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {runState === "running" ? "Pause" : "Run"}
              </button>
              <button onClick={saveWorkflow} disabled={savingWorkflow} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-xs font-black transition hover:bg-secondary disabled:opacity-50">
                {savingWorkflow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
              <button onClick={downloadBrief} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-xs font-black transition hover:bg-secondary">
                <Download className="h-4 w-4" />
                Brief
              </button>
            </div>
          </div>

          <div className="relative min-h-[700px] overflow-hidden bg-[#151923]">
            <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,#10131b_0%,#263347_100%)]" />
            <div className="absolute left-7 top-6 hidden h-20 w-40 overflow-hidden rounded-lg border-4 border-[#6d543f] bg-[#8fd0ff] shadow-inner lg:block">
              <div className="absolute bottom-0 h-6 w-full bg-[#31485c]" />
              <div className="absolute left-4 top-5 h-3 w-12 rounded-full bg-white/50" />
              <div className="absolute right-5 top-8 h-3 w-16 rounded-full bg-white/40" />
            </div>
            <div className="absolute right-7 top-5 hidden h-28 w-[330px] rounded-lg border-4 border-[#6d543f] bg-stone-100 p-3 shadow-lg lg:block">
              <Whiteboard mode={mode} research={research} activeStep={activeStep} />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[80%] bg-[#6e5742] [background-image:linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="absolute left-4 top-36 z-30 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
              {modes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-black transition",
                      mode === item.id ? "border-white bg-white text-stone-950" : "border-white/20 bg-black/25 text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="absolute right-4 top-36 z-30 hidden rounded-md border border-white/10 bg-black/35 px-3 py-2 text-white backdrop-blur md:block">
              <div className="flex items-center gap-2">
                <Radio className={cn("h-4 w-4", runState === "running" ? "animate-pulse text-emerald-300" : "text-white/50")} />
                <span className="text-xs font-black">{activeFloorMeta.room}</span>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">{activeFloorMeta.objective}</p>
            </div>

            <div className="absolute bottom-11 left-1/2 z-10 h-[430px] w-[980px] max-w-[96%] -translate-x-1/2 rounded-[18px] border border-black/20 bg-black/10 shadow-2xl">
              <div className="absolute left-[6%] top-[10%] rounded-md bg-stone-950 px-3 py-1 text-xs font-black text-white shadow-lg">
                {activeFloorMeta.name}
              </div>
              <OfficeSprite src="elevator_frame.png" className="absolute bottom-28 left-2 h-36 opacity-90" />
              <OfficeSprite src="boss-rug.png" className="absolute bottom-20 left-[39%] h-28 opacity-80" />
              <OfficeSprite src="plant.png" className="absolute bottom-12 left-8 h-24" />
              <OfficeSprite src="watercooler.png" className="absolute bottom-12 right-8 h-28" />
              <OfficeSprite src="old-printer.png" className={cn("absolute bottom-10 left-[31%] h-16", runState === "complete" && "animate-pulse")} />
              <OfficeSprite src="coffee-machine.png" className="absolute bottom-10 right-[29%] h-16" />
              <OfficeSprite src="employee-of-month.png" className="absolute right-[17%] top-[8%] h-20 opacity-90" />

              {research.agents.map((agent, index) => {
                const position = agentPosition(index);
                const projectedStatus = nextAgentStatus(agent, index, activeStep, runState);
                const active = index === activeStep % Math.max(1, research.agents.length) && runState === "running";
                return (
                  <div
                    key={agent.name}
                    className="absolute z-20 w-40 -translate-x-1/2 text-left transition duration-300"
                    style={{ left: `${position.left}%`, top: `${position.top}%` }}
                  >
                    <div className={cn("relative rounded-lg border px-3 py-2 shadow-lg", statusTone(projectedStatus), active && "ring-2 ring-emerald-400")}>
                      {active ? (
                        <div className="absolute -top-12 left-7 max-w-40 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[10px] font-black text-stone-800 shadow-lg">
                          {agent.task}
                          <span className="absolute -bottom-1 left-5 h-2 w-2 rotate-45 bg-white" />
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-white/80 ring-1 ring-black/5">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black">{agent.name}</p>
                          <p className="truncate text-[9px] font-bold opacity-60">{statusLabels[projectedStatus]}</p>
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

            <div className="absolute bottom-4 left-4 right-4 z-30 grid gap-2 md:grid-cols-4">
              {[
                { label: "Source leads", value: research.sourceQueue.length, icon: Globe2 },
                { label: "Research cards", value: totalCards, icon: LayoutGrid },
                { label: "Active agent", value: activeAgent?.name ?? "Scout", icon: Monitor },
                { label: "Findings", value: research.findings.length, icon: ClipboardList },
              ].map((stat) => (
                <div key={stat.label} className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-white backdrop-blur">
                  <stat.icon className="h-4 w-4 shrink-0 text-emerald-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{stat.value}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">{stat.label}</p>
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
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Signal board</p>
                <p className="text-sm font-black text-foreground">{research.title}</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <MiniChart values={signalValues} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-secondary p-2">
                <p className="text-lg font-black text-foreground">{research.sourceQueue.length}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Sources</p>
              </div>
              <div className="rounded-md bg-secondary p-2">
                <p className="text-lg font-black text-foreground">{research.agents.length}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Agents</p>
              </div>
              <div className="rounded-md bg-secondary p-2">
                <p className="text-lg font-black text-foreground">{totalCards}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Cards</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Research brief</p>
                <p className="text-sm font-black text-foreground">Operator-ready synthesis</p>
              </div>
              <button onClick={copyBrief} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background transition hover:bg-secondary" title="Copy brief">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{research.summary}</p>
            <div className="mt-4 space-y-2">
              {research.findings.slice(0, 4).map((finding) => (
                <div key={finding} className="flex gap-2 rounded-md bg-secondary/60 p-2 text-xs font-semibold text-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex border-b border-border bg-secondary/60">
              {[
                { id: "sources", label: "Sources" },
                { id: "log", label: "Log" },
                { id: "brief", label: "Brief" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as SidebarTab)}
                  className={cn("flex-1 px-3 py-2 text-xs font-black uppercase tracking-[0.12em]", tab === item.id ? "bg-card text-foreground" : "text-muted-foreground")}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="max-h-[440px] overflow-y-auto p-4 preview-scroll">
              {tab === "sources" ? (
                <div className="space-y-3">
                  {research.sourceQueue.length ? (
                    research.sourceQueue.map((source) => (
                      <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border bg-background p-3 transition hover:bg-secondary/60">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-black text-foreground">{source.title}</p>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </div>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-accent">{source.sourceType}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.snippet || "Open source lead for review."}</p>
                      </a>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm font-semibold leading-6 text-muted-foreground">
                      Source leads will appear here after KOffice runs live research.
                    </div>
                  )}
                </div>
              ) : tab === "log" ? (
                <div className="space-y-3">
                  {research.timeline.length ? (
                    research.timeline.map((item, index) => (
                      <div key={`${item.label}-${item.detail}`} className={cn("flex gap-3 rounded-lg p-2", index === activeStep ? "bg-emerald-50" : "")}>
                        <span className={cn("grid h-7 w-12 shrink-0 place-items-center rounded-full text-[10px] font-black", index < activeStep || runState === "complete" ? "bg-emerald-600 text-white" : index === activeStep && runState === "running" ? "bg-amber-500 text-white" : "bg-secondary")}>
                          {item.label}
                        </span>
                        <div>
                          <p className="text-sm font-black text-foreground">{item.detail}</p>
                          <p className="text-xs text-muted-foreground">{index === activeStep && runState === "running" ? "running" : index < activeStep || runState === "complete" ? "complete" : "queued"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm font-semibold leading-6 text-muted-foreground">
                      The agent timeline will be written when a run starts.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <pre className="whitespace-pre-wrap rounded-lg bg-stone-950 p-3 text-xs leading-5 text-white">{brief}</pre>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={copyBrief} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-black transition hover:bg-secondary">
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button onClick={downloadBrief} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-black transition hover:bg-secondary">
                      <Archive className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid gap-px bg-border lg:grid-cols-4">
          {Object.entries(research.kanban).map(([column, cards]) => (
            <div key={column} className="bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{column}</p>
                <span className="rounded bg-secondary px-2 py-1 text-xs font-black text-muted-foreground">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.length ? (
                  cards.map((card, index) => (
                    <div key={`${column}-${card}`} className="rounded-md border border-border bg-background p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded bg-stone-950 text-[10px] font-black text-white">{index + 1}</span>
                        <Send className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-bold leading-5 text-foreground">{card}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-border p-3 text-xs font-semibold leading-5 text-muted-foreground">
                    Waiting for run output.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {research.agents.length ? (
            research.agents.map((agent, index) => {
              const projectedStatus = nextAgentStatus(agent, index, activeStep, runState);
              return (
                <div key={agent.name} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start gap-3">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", statusTone(projectedStatus))}>
                      <Bot className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">{agent.name}</p>
                      <p className="truncate text-xs font-bold text-muted-foreground">{agent.desk}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{agent.task}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm font-semibold leading-6 text-muted-foreground md:col-span-2 xl:col-span-4">
              No agents deployed yet. Start research and KOffice will create an agent plan for this run.
              </div>
          )}
        </div>
      </Card>
    </div>
  );
}
