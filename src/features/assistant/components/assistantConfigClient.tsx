"use client";

import { useState, useTransition } from "react";
import { Bot, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AssistantRecord = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "archived";
  tone: string;
  welcome_message: string;
  system_prompt: string;
  knowledge_summary: string | null;
};

export function AssistantConfigClient({
  workspaceId,
  pageId,
  assistant,
}: {
  workspaceId: string;
  pageId: string | null;
  assistant?: AssistantRecord | null;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function saveAssistant(formData: FormData) {
    if (!pageId) {
      setMessage("Create a page before enabling the public assistant.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/ai/assistants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          pageId,
          name: String(formData.get("name") ?? "Public AI guide"),
          status: String(formData.get("status") ?? "active"),
          tone: String(formData.get("tone") ?? "helpful"),
          welcomeMessage: String(formData.get("welcomeMessage") ?? ""),
          systemPrompt: String(formData.get("systemPrompt") ?? ""),
          knowledgeSummary: String(formData.get("knowledgeSummary") ?? ""),
          permissions: {
            recommend_offers: true,
            start_booking: true,
            start_checkout: true,
            capture_leads: true,
          },
        }),
      });
      const json = await res.json();
      setMessage(json?.ok ? "Assistant saved and scoped to published page data." : json?.error?.message ?? "Could not save assistant.");
    });
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight">Public AI assistant</h2>
            <p className="text-sm text-muted-foreground">Configure the assistant visitors see on your public page.</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-muted-foreground">
            <Bot className="h-5 w-5" />
          </div>
        </div>

        <form action={saveAssistant} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="assistant-name">Name</Label>
            <Input id="assistant-name" name="name" defaultValue={assistant?.name ?? "Public AI guide"} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select name="status" defaultValue={assistant?.status ?? "active"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tone">Tone</Label>
            <Input id="tone" name="tone" defaultValue={assistant?.tone ?? "helpful"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="welcomeMessage">Welcome message</Label>
            <Input id="welcomeMessage" name="welcomeMessage" defaultValue={assistant?.welcome_message ?? "Tell me your goal and I will recommend the right next step."} />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="knowledgeSummary">Knowledge summary</Label>
            <Textarea id="knowledgeSummary" name="knowledgeSummary" defaultValue={assistant?.knowledge_summary ?? ""} placeholder="Audience, niche, promises, product guidance, FAQs..." />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="systemPrompt">Safety prompt</Label>
            <Textarea id="systemPrompt" name="systemPrompt" defaultValue={assistant?.system_prompt ?? "Recommend published offers only. Do not reveal private dashboard data."} />
          </div>
          <div className="flex items-center gap-3 lg:col-span-2">
            <Button disabled={isPending || !pageId}>
              <Save className="h-4 w-4" /> Save assistant
            </Button>
            <Badge variant="outline">Published offers only</Badge>
          </div>
        </form>
        {message ? <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
