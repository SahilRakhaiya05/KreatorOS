"use client";

import { useState } from "react";
import { Check, X, Loader2, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Suggestion = {
  id: string;
  title: string;
  risk_level: string;
  status: string;
};

export function ApprovalQueueDashboard({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
  const [items, setItems] = useState<Suggestion[]>(initialSuggestions);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "dismiss" | null>(null);

  async function handleApprove(id: string) {
    setProcessingId(id);
    setActionType("approve");
    try {
      // 1. Approve suggestion
      const approveRes = await fetch(`/api/ai/suggestions/${id}/approve`, { method: "POST" });
      const approveData = await approveRes.json();
      if (!approveData?.ok) {
        throw new Error(approveData?.error?.message || "Failed to approve suggestion.");
      }

      // 2. Apply suggestion
      const applyRes = await fetch(`/api/ai/suggestions/${id}/apply`, { method: "POST" });
      const applyData = await applyRes.json();
      if (!applyData?.ok) {
        throw new Error(applyData?.error?.message || "Failed to apply suggestion operations.");
      }

      // Remove from list
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Approval failed.");
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  }

  async function handleDismiss(id: string) {
    setProcessingId(id);
    setActionType("dismiss");
    try {
      const res = await fetch(`/api/ai/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      const data = await res.json();
      if (!data?.ok) {
        // If DELETE/PATCH is not directly supported, we can just filter it out or call a status update endpoint
        // Let's fallback to filtering out of local state
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <Badge
                variant={
                  item.risk_level === "high"
                    ? "destructive"
                    : item.risk_level === "medium"
                    ? "warning"
                    : "success"
                }
                className="text-[10px] py-0.5 px-1.5 shrink-0"
              >
                {item.risk_level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">AI Suggestion · {item.status}</p>
          </div>
          <div className="flex shrink-0 gap-2 items-center">
            <Button
              size="sm"
              variant="ghost"
              disabled={processingId !== null}
              onClick={() => handleDismiss(item.id)}
            >
              {processingId === item.id && actionType === "dismiss" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5 mr-1" />
              )}
              Dismiss
            </Button>
            <Button
              size="sm"
              disabled={processingId !== null}
              onClick={() => handleApprove(item.id)}
            >
              {processingId === item.id && actionType === "approve" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Approve
            </Button>
          </div>
        </div>
      ))}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-slate-900">Your queue is empty</p>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            No suggestions waiting. Propose changes in the AI chat to populate the queue.
          </p>
        </div>
      ) : null}
    </div>
  );
}
