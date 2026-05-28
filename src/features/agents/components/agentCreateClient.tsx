"use client";

import { useState } from "react";
import { Plus, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AVAILABLE_TOOLS = [
  { id: "check_availability", label: "Check Availability", description: "Query calendar slots status" },
  { id: "create_event", label: "Book Calendar Event", description: "Instantly create google calendar meeting invites" },
  { id: "write_copy", label: "Write Page Copy", description: "Generate copy layout drafts for site blocks" },
  { id: "create_product", label: "Create Gated Product", description: "Define courses, downloads, and gated content" },
  { id: "pricing_test", label: "Pricing Suggestions", description: "A/B price suggestions analysis" },
  { id: "summarize_transcript", label: "Summarize Interview", description: "Distill user research summaries" },
  { id: "lookup_order", label: "Lookup Customer Order", description: "Verify order statuses for client support" },
  { id: "send_reminder", label: "Send Messaging Notifications", description: "Dispatch transactional emails/WhatsApp alerts" },
];

export function AgentCreateClient() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  function toggleTool(toolId: string) {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          scope: scope.trim() || undefined,
          tools: selectedTools,
        }),
      });

      const data = await response.json();
      if (!data?.ok) {
        throw new Error(data?.error?.message || "Failed to create agent.");
      }

      setOpen(false);
      setName("");
      setDescription("");
      setScope("");
      setSelectedTools([]);
      
      // Reload page to reflect new DB agent
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_24px_70px_rgba(28,25,23,.18)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Configure Custom Agent
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a scoped agent with restricted tools, memory, and compliance policies.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p className="rounded-lg bg-destructive/10 p-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="agent-name" className="text-xs font-semibold">
                Agent Name
              </Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Support Representative"
                required
                className="rounded-xl border-stone-200 bg-stone-50 text-sm focus:ring-4 focus:ring-stone-200"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="agent-scope" className="text-xs font-semibold">
                Target Scope / Mission
              </Label>
              <Input
                id="agent-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g. Answers order issues and processes product refunds"
                className="rounded-xl border-stone-200 bg-stone-50 text-sm focus:ring-4 focus:ring-stone-200"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="agent-desc" className="text-xs font-semibold">
                Core Instructions & Tone
              </Label>
              <Textarea
                id="agent-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Be extremely helpful, polite, and verify access grants before issuing codes."
                rows={3}
                className="rounded-xl border-stone-200 bg-stone-50 text-sm focus:ring-4 focus:ring-stone-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Equipped Tools</Label>
              <div className="max-h-[160px] overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/50 p-2 space-y-1.5 no-scrollbar">
                {AVAILABLE_TOOLS.map((tool) => {
                  const active = selectedTools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => toggleTool(tool.id)}
                      className={`flex w-full items-start gap-2.5 rounded-lg border p-2 text-left transition ${
                        active
                          ? "border-violet-300 bg-violet-50/50"
                          : "border-stone-100 bg-white hover:border-stone-200"
                      }`}
                    >
                      <div className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-md ${
                        active ? "text-violet-600" : "text-stone-300"
                      }`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${active ? "text-violet-950" : "text-stone-700"}`}>
                          {tool.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Create Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
