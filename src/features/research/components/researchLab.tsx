"use client";

import { useState, useEffect } from "react";
import { Badge, Card, cn } from "@/components/ui";
import { Calendar, FileText, Mic, Send, Sparkles, Upload, Users, Video, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { captureClientEvent, analyticsEvents } from "@/client/posthog/events";

type Study = {
  id: string;
  title: string;
  status: string;
  language: string;
  goal: string;
  script: {
    participants: number;
    completed: number;
  };
};

export function ResearchLab() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [selected, setSelected] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New Study Dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newLanguage, setNewLanguage] = useState("EN");
  const [saving, setSaving] = useState(false);

  async function fetchStudies() {
    try {
      const res = await fetch("/api/creator/research-studies");
      const json = await res.json();
      if (json.ok && Array.isArray(json.data?.studies)) {
        const loadedStudies = json.data.studies;
        setStudies(loadedStudies);
        if (loadedStudies.length > 0) {
          setSelected((prev) => {
            if (prev) {
              const matched = loadedStudies.find((s: Study) => s.id === prev.id);
              if (matched) return matched;
            }
            return loadedStudies[0];
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch research studies:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudies();
  }, []);

  const handleAddStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    captureClientEvent(analyticsEvents.researchLabStudyCreated, { title: newTitle.trim() });
    setSaving(true);
    try {
      const res = await fetch("/api/creator/research-studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          goal: newGoal.trim(),
          language: newLanguage,
          status: "Draft",
          script: { participants: 0, completed: 0 }
        })
      });
      const json = await res.json();
      if (json.ok) {
        setShowAddModal(false);
        setNewTitle("");
        setNewGoal("");
        setNewLanguage("EN");
        await fetchStudies();
      }
    } catch (err) {
      console.error("Failed to create study:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      {/* Sidebar List */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-black text-slate-950">Research projects</p>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="h-7 text-[10px] font-bold gap-1 px-2.5 bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-3 w-3" /> New Study
          </Button>
        </div>
        <div className="space-y-3">
          {studies.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No research projects yet.</p>
          ) : (
            studies.map((study) => (
              <button
                key={study.id}
                onClick={() => {
                  setSelected(study);
                  captureClientEvent(analyticsEvents.researchLabStudySelected, {
                    study_id: study.id,
                    title: study.title,
                  });
                }}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all",
                  selected?.id === study.id
                    ? "border-violet-300 bg-violet-50"
                    : "border-slate-200 bg-slate-50 hover:bg-white"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-955 truncate text-xs">{study.title}</p>
                  <Badge tone={study.status === "Completed" ? "green" : study.status === "Running" ? "blue" : "amber"}>
                    {study.status}
                  </Badge>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 font-bold">
                  {study.script?.completed || 0}/{study.script?.participants || 0} interviews · {study.language}
                </p>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Main Study Details */}
      {selected ? (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-violet-600">Automated customer research</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{selected.title}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-600 font-semibold">
                  AI can import customers, localize outreach, schedule interviews, join Zoom/Meet, ask adaptive questions, transcribe, summarize themes, extract quotes, and push product decisions into the AI operator.
                </p>
              </div>
              <button 
                onClick={() => captureClientEvent(analyticsEvents.researchLabStudyLaunched, {
                  study_id: selected.id,
                  title: selected.title,
                })}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shrink-0 hover:bg-slate-800 transition"
              >
                Launch study
              </button>
            </div>
            <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-5">
              {[
                [Upload, "Import", "CSV/customers"],
                [Send, "Outreach", "Personalized"],
                [Calendar, "Schedule", "Timezone-aware"],
                [Video, "Interview", "AI moderated"],
                [FileText, "Insights", "Themes + quotes"],
              ].map(([Icon, title, text]) => (
                <div key={String(title)} className="rounded-2xl bg-slate-50 p-4">
                  <Icon className="mb-3 h-5 w-5 text-violet-600" />
                  <p className="text-sm font-black">{String(title)}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{String(text)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <p className="font-black text-slate-950">Insight board</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {[
                { label: "Core Findings", color: "rose" as const, text: selected.goal || "Analyzing user responses..." },
                { label: "Winning language", color: "green" as const, text: "They react best to 'AI business system' over 'prompt templates'." },
                { label: "New offer idea", color: "violet" as const, text: "Add a $19 async video audit as low-friction entry." },
              ].map((item, index) => (
                <div key={item.label} className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200">
                  <Badge tone={item.color}>{item.label}</Badge>
                  <p className="mt-4 text-xs leading-relaxed text-slate-700 font-bold">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-mint p-4">
              <p className="flex items-center gap-2 text-sm font-black text-emerald-950">
                <Sparkles className="h-4 w-4" /> AI action recommendation
              </p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900 font-bold">
                Based on findings in "{selected.title}": Create a low-ticket async audit offer, place it above the $149 audit, and run a 14-day A/B test.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
          <Mic className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-bold">Select a research study or create a new one to begin.</p>
        </Card>
      )}

      {/* Add Study Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              Create Custom Research Study
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define the customer feedback objectives for your AI research assistant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStudy} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Study Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Why buyers cancel subscriptions"
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Research Hypothesis / Core Insight Goal</label>
              <textarea
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Describe what you want the AI to extract (e.g. Customers need a lower price point tier)..."
                rows={3}
                required
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Target Language</label>
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="EN">English (EN)</option>
                <option value="EN + Hindi">English + Hindi</option>
                <option value="ES">Spanish (ES)</option>
                <option value="FR">French (FR)</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving || !newTitle.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Study"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
