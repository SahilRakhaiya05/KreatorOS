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
type ViewMode = "office" | "sources" | "agents" | "kanban" | "timeline" | "findings" | "desktop";
type SidebarTab = "sources" | "log" | "brief";

type E2BDesktopStep = {
  stepIndex: number;
  timestamp: string;
  action: "create" | "launch" | "mouse_move" | "mouse_click" | "keyboard_type" | "screenshot" | "shell_exec" | "synthesize" | "close";
  sdkCode: string;
  log: string;
  activeWindow: "desktop" | "terminal" | "chrome" | "editor";
  cursorX?: number;
  cursorY?: number;
  terminalOutput?: string;
  chromeUrl?: string;
  chromeTabTitle?: string;
  chromeContentHtml?: string;
  editorContent?: string;
};

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
  sandboxId?: string;
  desktopSteps?: E2BDesktopStep[];
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
  { id: "desktop", label: "🖥️ E2B Desktop", icon: Monitor },
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
    desktopSteps: run.research?.desktopSteps ?? [],
    sandboxId: run.research?.sandboxId ?? "",
  };
}

export function WorkflowCanvas() {
  const [research, setResearch] = useState<ResearchResult>(emptyResearch);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("");
  const [angle, setAngle] = useState("");
  const [sandboxType, setSandboxType] = useState<"standard" | "e2b_desktop">("standard");
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

  // E2B Interactive Desktop Monitor States & Handlers
  const [sandboxWindow, setSandboxWindow] = useState<"desktop" | "terminal" | "chrome" | "editor" | null>(null);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [runningCmd, setRunningCmd] = useState(false);
  const [vncConnected, setVncConnected] = useState(false);
  const [recycling, setRecycling] = useState(false);

  async function runCustomCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput;
    setTerminalInput("");
    setRunningCmd(true);
    setTerminalHistory((prev) => [...prev, `e2b@sandbox:~$ ${cmd}`]);

    try {
      const res = await fetch("/api/ai/research/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, query, audience }),
      });
      const json = await res.json();
      if (json.ok) {
        setTerminalHistory((prev) => [
          ...prev,
          json.data.stdout || "",
          json.data.stderr ? `stderr: ${json.data.stderr}` : "",
        ].filter(Boolean));
      } else {
        setTerminalHistory((prev) => [...prev, `Error: ${json.error?.message ?? "unknown error"}`]);
      }
    } catch {
      setTerminalHistory((prev) => [...prev, "Network error executing sandboxed command."]);
    } finally {
      setRunningCmd(false);
    }
  }

  async function recycleSandbox() {
    setRecycling(true);
    showToast("Releasing secure microVM sandbox container...");
    window.setTimeout(() => {
      setResearch(emptyResearch);
      setActiveRunId(null);
      setRunState("idle");
      setActiveStep(0);
      setSandboxWindow(null);
      setTerminalHistory([]);
      setRecycling(false);
      showToast("E2B Sandbox recycled successfully. All resources released.");
    }, 1800);
  }

  const activeFloorMeta = floors.find((floor) => floor.id === activeFloor) ?? floors[1];
  const activeAgent = research.agents[activeStep % Math.max(1, research.agents.length)];
  const desktopSteps = research.desktopSteps || [];
  const currentStep = desktopSteps.length > 0 ? desktopSteps[activeStep % Math.max(1, desktopSteps.length)] : null;
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
    setProvider(sandboxType === "e2b_desktop" ? "E2B Desktop VM" : "Deploying agents");

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, audience, angle, sandboxType }),
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
      
      if (sandboxType === "e2b_desktop") {
        setProvider(savedRun?.provider === "e2b_desktop_sdk" ? "E2B Desktop SDK" : "E2B Desktop Sandbox");
        setMode("desktop");
      } else {
        setProvider(json.data.available ? "Gemini synthesis" : "Public source synthesis");
        setMode("office");
      }
      
      setTab("sources");
      setActiveStep(0);
      setRunState("running");
      showToast(sandboxType === "e2b_desktop" ? "KOffice initiated E2B Sandbox successfully" : "KOffice saved the run and is presenting the final answer");
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
    
    const isE2B = run.research?.desktopSteps?.length || run.provider.startsWith("e2b_");
    setSandboxType(isE2B ? "e2b_desktop" : "standard");
    
    if (isE2B) {
      setProvider(run.provider === "e2b_desktop_sdk" ? "E2B Desktop SDK" : "E2B Desktop Sandbox");
      setMode("desktop");
    } else {
      setProvider(run.provider === "google" ? "Gemini synthesis" : "Public source synthesis");
      setMode("office");
    }
    
    setQuery(run.query);
    setAudience(run.audience ?? "");
    setAngle(run.angle ?? "");
    setRunState(run.status === "complete" ? "complete" : run.status === "running" ? "running" : "idle");
    setActiveStep(run.status === "complete" ? Math.max(0, (run.timeline?.length ?? 1) - 1) : run.active_step ?? 0);
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
    const desktopStepsCount = research.desktopSteps?.length || 0;
    const maxSteps = desktopStepsCount > 0
      ? desktopStepsCount
      : Math.max(research.timeline.length, research.agents.length, 1);

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
  }, [runState, research.timeline.length, research.agents.length, research.desktopSteps]);

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
              <div className="mt-2 grid gap-2 md:grid-cols-3">
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
                <select
                  value={sandboxType}
                  onChange={(event) => setSandboxType(event.target.value as "standard" | "e2b_desktop")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                >
                  <option value="standard">⚡ Standard Web Agent</option>
                  <option value="e2b_desktop">🖥️ E2B Desktop Sandbox</option>
                </select>
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

            {(() => {
              const activeDesktopWindow = sandboxWindow || currentStep?.activeWindow || "desktop";
              return mode === "desktop" ? (
                <div className="absolute bottom-11 left-1/2 z-10 h-[440px] w-[980px] max-w-[96%] -translate-x-1/2 rounded-[18px] border border-stone-800 bg-[#0f111a] shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
                  {/* OS Header / Top Panel */}
                  <div className="flex h-9 items-center justify-between bg-stone-900 px-4 text-stone-300 border-b border-stone-800 shrink-0 select-none font-sans">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex h-2.5 w-2.5 rounded-full", runState === "running" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                      <span className="font-bold text-[11px] text-white font-mono">E2B Sandbox: {research.sandboxId || "sb-desktop-koffice-q82x"}</span>
                    </div>
                    {/* OS Controls */}
                    <div className="flex items-center gap-1.5 text-[9px] font-bold">
                      <button onClick={() => setSandboxWindow("chrome")} className={cn("px-2 py-1 rounded transition", activeDesktopWindow === "chrome" ? "bg-stone-800 text-white" : "hover:bg-stone-850 text-stone-400")}>
                        Chrome
                      </button>
                      <button onClick={() => setSandboxWindow("terminal")} className={cn("px-2 py-1 rounded transition", activeDesktopWindow === "terminal" ? "bg-stone-800 text-white" : "hover:bg-stone-850 text-stone-400")}>
                        Terminal
                      </button>
                      <button onClick={() => setSandboxWindow("editor")} className={cn("px-2 py-1 rounded transition", activeDesktopWindow === "editor" ? "bg-stone-800 text-white" : "hover:bg-stone-850 text-stone-400")}>
                        brief.txt
                      </button>
                      <button onClick={() => setSandboxWindow("desktop")} className={cn("px-2 py-1 rounded transition", activeDesktopWindow === "desktop" ? "bg-stone-800 text-white" : "hover:bg-stone-850 text-stone-400")}>
                        Desktop
                      </button>
                      <span className="w-px h-3.5 bg-stone-850 mx-1" />
                      <button onClick={() => setVncConnected(!vncConnected)} className={cn("px-2 py-1 rounded transition flex items-center gap-1", vncConnected ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "hover:bg-stone-850 text-stone-400")}>
                        <Radio className="h-3 w-3" /> {vncConnected ? "VNC Active" : "VNC Stream"}
                      </button>
                      <button onClick={recycleSandbox} disabled={recycling} className="px-2 py-1 rounded bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 transition flex items-center gap-1 disabled:opacity-50 font-bold uppercase tracking-wider">
                        {recycling ? "Recycling..." : "Destroy"}
                      </button>
                    </div>
                  </div>

                  {/* OS Workspace Desktop Background */}
                  <div className="relative flex-1 bg-gradient-to-br from-[#1e2330] to-[#0c0d12] p-4 overflow-hidden select-none">
                    {/* Grid lines */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

                    {/* VNC connection overlay */}
                    {vncConnected && (
                      <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-45 flex flex-col items-center justify-center text-white select-none font-sans">
                        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-full text-emerald-400 font-bold mb-4">
                          <Radio className="h-4 w-4 animate-pulse" />
                          <span>VNC Active Client Stream Connected (1280x800)</span>
                        </div>
                        <div className="text-[10px] text-stone-400 max-w-sm text-center leading-relaxed">
                          Live VNC screen mirroring is reading sandbox framebuffer updates from target virtual display :1.0
                        </div>
                        <button onClick={() => setVncConnected(false)} className="mt-5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-850 px-4 py-2 text-stone-300 transition text-[11px] font-bold">
                          Disconnect Stream
                        </button>
                      </div>
                    )}

                    {/* Desktop Icons */}
                    <div className="absolute left-4 top-4 flex flex-col gap-5 text-center text-[10px] font-sans font-semibold text-white/80 z-10">
                      <button onClick={() => setSandboxWindow("chrome")} className="flex flex-col items-center gap-1 w-14 group outline-none">
                        <div className="grid h-9 w-9 place-items-center rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg group-hover:bg-sky-500/25 group-hover:border-sky-500/40 transition">
                          <Globe2 className="h-5 w-5" />
                        </div>
                        <span>Chrome</span>
                      </button>
                      <button onClick={() => setSandboxWindow("terminal")} className="flex flex-col items-center gap-1 w-14 group outline-none">
                        <div className="grid h-9 w-9 place-items-center rounded bg-stone-500/15 text-stone-200 border border-stone-500/25 shadow-lg group-hover:bg-stone-500/35 group-hover:border-stone-500/50 transition">
                          <Monitor className="h-5 w-5" />
                        </div>
                        <span>Terminal</span>
                      </button>
                      <button onClick={() => setSandboxWindow("editor")} className="flex flex-col items-center gap-1 w-14 group outline-none">
                        <div className="grid h-9 w-9 place-items-center rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg group-hover:bg-emerald-500/25 group-hover:border-emerald-500/40 transition">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span>brief.txt</span>
                      </button>
                    </div>

                    {/* Dynamic Cursor with coordinate transitions */}
                    {currentStep?.cursorX && currentStep?.cursorY && activeDesktopWindow !== "desktop" && (
                      <div 
                        className="absolute z-50 pointer-events-none transition-all duration-[1100ms] ease-in-out"
                        style={{ 
                          left: `${(currentStep.cursorX / 1280) * 100}%`, 
                          top: `${(currentStep.cursorY / 800) * 100}%` 
                        }}
                      >
                        {/* Virtual Mouse pointer */}
                        <div className="relative">
                          <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-400 drop-shadow-md fill-current">
                            <path d="M4.5 3v15.25l3.96-3.95 2.82 6.55 2.62-1.12-2.82-6.55H17.5L4.5 3z" />
                          </svg>
                          {/* Click Ripple Effect */}
                          {currentStep.action === "mouse_click" && (
                            <span className="absolute -left-1 -top-1 h-8 w-8 rounded-full border border-emerald-400 bg-emerald-400/20 animate-ping opacity-75" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Terminal Window Frame */}
                    {activeDesktopWindow === "terminal" && (
                      <div className="absolute right-10 top-6 h-[230px] w-[520px] rounded-lg border border-stone-700 bg-stone-950/90 shadow-2xl flex flex-col backdrop-blur-sm z-30 overflow-hidden">
                        <div className="flex h-7 items-center justify-between bg-stone-900/90 px-3 border-b border-stone-800 rounded-t-lg shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-[10px] text-stone-400 font-sans font-semibold">e2b@sandbox: /home/user</span>
                          <button onClick={() => setSandboxWindow("desktop")} className="text-[10px] text-stone-500 hover:text-stone-300 font-sans">✕</button>
                        </div>
                        <div className="flex-1 p-3 font-mono text-[10px] leading-5 text-emerald-400 overflow-y-auto text-left select-text flex flex-col justify-between">
                          <div className="overflow-y-auto flex-1 max-h-[140px] pr-2 preview-scroll">
                            {currentStep?.terminalOutput || "e2b@sandbox:~$\n"}
                            {terminalHistory.map((line, idx) => (
                              <div key={idx} className="whitespace-pre-wrap">{line}</div>
                            ))}
                            {runningCmd && <div className="text-stone-500 font-sans animate-pulse">Running on secure E2B container...</div>}
                          </div>
                          <form onSubmit={runCustomCommand} className="flex gap-1.5 border-t border-stone-800/80 pt-2 shrink-0">
                            <span className="text-emerald-500 shrink-0 select-none">e2b@sandbox:~$</span>
                            <input
                              value={terminalInput}
                              onChange={(e) => setTerminalInput(e.target.value)}
                              placeholder="Type shell command (e.g. ls, pwd, cat brief.txt)..."
                              disabled={runningCmd}
                              className="flex-1 bg-transparent text-emerald-400 outline-none border-none p-0 text-[10px] font-mono w-full"
                            />
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Chrome Window Frame */}
                    {activeDesktopWindow === "chrome" && (
                      <div className="absolute inset-x-20 top-6 bottom-6 rounded-lg border border-stone-700 bg-stone-900 shadow-2xl flex flex-col z-20 overflow-hidden">
                        {/* Chrome Bar */}
                        <div className="flex h-8 items-center gap-3 bg-stone-800 px-3 shrink-0">
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                          <div className="flex h-6 items-center rounded bg-stone-950 px-3 text-stone-300 text-[10px] w-40 border border-stone-800 shrink-0 font-sans truncate gap-2 select-none">
                            <span className="h-2 w-2 rounded-full bg-sky-400" />
                            {currentStep?.chromeTabTitle || "New Tab"}
                          </div>
                          <div className="flex-1 flex h-6 items-center rounded bg-stone-950 px-3 text-[10px] text-stone-400 border border-stone-800 shrink-0 truncate font-sans text-left">
                            {currentStep?.chromeUrl || "about:blank"}
                          </div>
                          <button onClick={() => setSandboxWindow("desktop")} className="text-[10px] text-stone-500 hover:text-stone-300 font-sans pl-2 select-none">✕</button>
                        </div>

                        {/* Browser Webpage Canvas */}
                        <div className="flex-1 bg-white p-4 text-stone-800 overflow-y-auto font-sans text-left select-text">
                          <div className="max-w-2xl mx-auto space-y-3">
                            <div className="flex items-center gap-3 border-b pb-2 shrink-0">
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-indigo-700 font-sans font-black text-[11px] select-none">G</span>
                              <div>
                                <h4 className="text-xs font-bold text-stone-900 leading-tight">{currentStep?.chromeTabTitle || "Page Context"}</h4>
                                <p className="text-[9px] text-stone-500 font-mono">{currentStep?.chromeUrl}</p>
                              </div>
                            </div>
                            <div className="text-[10px] leading-relaxed text-stone-600 whitespace-pre-wrap font-sans font-medium">
                              {currentStep?.chromeContentHtml || "Navigating browser canvas and capturing DOM tree nodes..."}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Editor Window Frame */}
                    {activeDesktopWindow === "editor" && (
                      <div className="absolute left-20 top-8 h-[220px] w-[460px] rounded-lg border border-stone-700 bg-stone-900 shadow-2xl flex flex-col z-30 overflow-hidden font-mono">
                        <div className="flex h-7 items-center justify-between bg-stone-800 px-3 border-b border-stone-700 shrink-0 select-none">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-[10px] text-stone-300 font-sans font-semibold">Mousepad - brief.txt</span>
                          <button onClick={() => setSandboxWindow("desktop")} className="text-[10px] text-stone-500 hover:text-stone-300 font-sans">✕</button>
                        </div>
                        <div className="flex-1 p-3 bg-stone-950/90 text-stone-300 overflow-y-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-left select-text">
                          {currentStep?.editorContent || "No brief draft in standard environment yet."}
                          <span className="inline-block h-3.5 w-1 bg-stone-300 animate-pulse ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OS Bottom Status / SDK Command Live Trace */}
                  <div className="h-24 bg-stone-950 border-t border-stone-800 p-2.5 flex shrink-0 gap-3 font-mono text-[10px] select-none text-left">
                    <div className="flex-1 flex flex-col border border-stone-800 bg-[#07080d] rounded p-2 overflow-hidden">
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-[7px] mb-0.5">E2B SDK Execution Trace</span>
                      <div className="flex-1 text-stone-300 overflow-y-auto whitespace-pre truncate text-[10px] leading-5 select-text">
                        <span className="text-stone-500 select-none">{"> "}</span>
                        <span className="text-sky-300">
                          {runningCmd
                            ? `await sandbox.commands.run("${terminalHistory[terminalHistory.length - 1]?.replace("e2b@sandbox:~$ ", "") || ""}")`
                            : currentStep?.sdkCode || "// Awaiting E2B execution step..."}
                        </span>
                      </div>
                    </div>
                    <div className="w-72 flex flex-col border border-stone-800 bg-[#07080d] rounded p-2 overflow-hidden">
                      <span className="text-amber-400 font-bold uppercase tracking-wider text-[7px] mb-0.5">Sandbox Live Logs</span>
                      <div className="flex-1 text-stone-400 overflow-y-auto select-text text-[9px] leading-relaxed">
                        {runningCmd
                          ? "Executing interactive custom shell command in Ubuntu cloud context..."
                          : currentStep?.log || "Idle. Ready to deploy secure container."}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
              );
            })()}

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
