"use client";

import { useEffect, useState } from "react";
import { Briefcase, CheckCircle2, CircleDollarSign, Loader2, Plus, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Program = {
  id: string;
  brand_name: string;
  status: string;
  rate_cents: number;
  currency: string;
  deliverables: string[];
  due_date: string | null;
  metadata?: Record<string, any> | null;
};

const pipeline = ["lead", "pitched", "replied", "negotiating", "approved", "delivered", "paid", "lost"] as const;
const inputClass = "h-10 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10";

function money(cents = 0, currency = "usd") {
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function BrandProgramBuilderClient() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [rateDollars, setRateDollars] = useState("1000");
  const [deliverables, setDeliverables] = useState("1x video, 1x short");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPrograms() {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/brand-deals");
      const json = await res.json();
      setPrograms((json.ok ? json.data?.deals ?? [] : []).filter((deal: Program) => deal.metadata?.public_program));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrograms();
  }, []);

  async function createProgram(event: React.FormEvent) {
    event.preventDefault();
    if (!brandName.trim()) return;
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          status: "lead",
          rateCents: Math.round(Number(rateDollars || 0) * 100),
          currency: "usd",
          deliverables: deliverables.split(",").map((item) => item.trim()).filter(Boolean),
          dueDate: dueDate || null,
          metadata: {
            public_program: true,
            marketplace_description: description,
            applications_open: true,
          },
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not create program.");
      setBrandName("");
      setRateDollars("1000");
      setDeliverables("1x video, 1x short");
      setDueDate("");
      setDescription("");
      setNotice("Program published successfully! Creators can now view and apply in the Marketplace.");
      await loadPrograms();
    } catch (err: any) {
      setNotice(err.message || "Failed to create program.");
    } finally {
      setSaving(false);
    }
  }

  async function updateProgram(program: Program, update: Partial<Program>) {
    setNotice("");
    try {
      const next = { ...program, ...update };
      const res = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: program.id,
          brandName: next.brand_name,
          contactName: null,
          contactEmail: null,
          status: next.status,
          rateCents: next.rate_cents,
          currency: next.currency,
          deliverables: next.deliverables ?? [],
          dueDate: next.due_date,
          metadata: next.metadata || {},
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not update program.");
      setPrograms((current) => current.map((item) => (item.id === program.id ? { ...item, ...json.data.deal } : item)));
      setNotice("Program updated successfully.");
    } catch (err: any) {
      setNotice(err.message || "Failed to update program.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">New program</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Publish a creator-facing offer.</p>

        {notice ? (
          <div className={cn(
            "mt-4 rounded-xl border px-4 py-3 text-xs font-bold transition-all",
            notice.includes("successfully") 
              ? "border-emerald-200 bg-emerald-50 text-emerald-800" 
              : "border-amber-200 bg-amber-50 text-amber-800"
          )}>
            {notice}
          </div>
        ) : null}

        <form onSubmit={createProgram} className="mt-5 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Name</span>
            <input className={inputClass} value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Launch campaign" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Description</span>
            <textarea className={cn(inputClass, "h-24 py-2")} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Audience, goals, notes..." />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Budget</span>
              <input className={inputClass} type="number" min="0" value={rateDollars} onChange={(event) => setRateDollars(event.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Deadline</span>
              <input className={inputClass} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          </div>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Deliverables</span>
            <textarea className={cn(inputClass, "h-20 py-2")} value={deliverables} onChange={(event) => setDeliverables(event.target.value)} />
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Publish program
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <h2 className="text-lg font-semibold text-foreground">Programs</h2>
          <Badge variant="secondary">{programs.length}</Badge>
        </div>
        {loading ? (
          <div className="grid h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
        ) : programs.length ? (
          <div className="divide-y divide-border">
            {programs.map((program) => (
              <div key={program.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{program.brand_name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{program.metadata?.marketplace_description || "Open program"}</p>
                  </div>
                  <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Live</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{money(program.rate_cents, program.currency)}</Badge>
                  {(program.deliverables ?? []).map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
                </div>
                {program.metadata?.creator_submission?.url ? (
                  <div className="mt-4 rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Submission</p>
                        <a className="mt-1 block truncate text-sm text-blue-600 underline-offset-2 hover:underline" href={program.metadata.creator_submission.url} target="_blank" rel="noreferrer">
                          {program.metadata.creator_submission.url}
                        </a>
                      </div>
                      <Badge variant="success">Ready</Badge>
                    </div>
                    {program.metadata.creator_submission.note ? <p className="mt-3 text-sm text-muted-foreground">{program.metadata.creator_submission.note}</p> : null}
                  </div>
                ) : null}
                <div className="mt-4 grid gap-3 rounded-lg border border-border bg-background p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Stage</span>
                    <select className={inputClass} value={program.status} onChange={(event) => void updateProgram(program, { status: event.target.value })}>
                      {pipeline.map((stage) => <option key={stage} value={stage}>{titleCase(stage)}</option>)}
                    </select>
                  </label>
                  <Button
                    type="button"
                    disabled={program.status !== "delivered"}
                    onClick={() =>
                      void updateProgram(program, {
                        status: "paid",
                        metadata: {
                          ...(program.metadata || {}),
                          payment_release: {
                            status: "released",
                            released_at: new Date().toISOString(),
                            release_method: "brand_recorded",
                          },
                        },
                      })
                    }
                  >
                    <CircleDollarSign className="h-4 w-4" />
                    Release
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid h-64 place-items-center p-6 text-center">
            <div>
              <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">No programs</p>
              <p className="mt-1 text-sm text-muted-foreground">Publish one to start.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
