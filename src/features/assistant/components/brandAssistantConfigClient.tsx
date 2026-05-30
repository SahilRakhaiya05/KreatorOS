"use client";

import { useState, useEffect, useTransition } from "react";
import { Handshake, Save, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BrandBotConfig = {
  welcomeMessage: string;
  systemPrompt: string;
  tone: string;
  enabled: boolean;
};

export function BrandAssistantConfigClient() {
  const [config, setConfig] = useState<BrandBotConfig | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function fetchConfig() {
    try {
      const res = await fetch("/api/creator/brand-bot");
      const json = await res.json();
      if (json.ok && json.data?.brandBot) {
        setConfig(json.data.brandBot);
      }
    } catch (err) {
      console.error("Failed to fetch brand bot config:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  function saveBrandBot(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/creator/brand-bot", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            welcomeMessage: String(formData.get("welcomeMessage")),
            systemPrompt: String(formData.get("systemPrompt")),
            tone: String(formData.get("tone")),
            enabled: formData.get("enabled") === "true",
          }),
        });
        const json = await res.json();
        if (json.ok) {
          setMessage("AI Brand Sponsor Chatbot settings updated successfully.");
          setConfig(json.data.brandBot);
        } else {
          setMessage(json.error?.message || "Failed to save settings.");
        }
      } catch {
        setMessage("Network error saving configuration.");
      }
    });
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-12 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border border-violet-200/60 shadow-md">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight text-violet-950 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
              <span>AI Brand Sponsor Chatbot</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure the AI assistant that brands interact with when they reach out to negotiate sponsorship campaigns.
            </p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-100 text-violet-700">
            <Handshake className="h-5 w-5" />
          </div>
        </div>

        <form action={saveBrandBot} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand-bot-enabled">Status</Label>
            <select
              id="brand-bot-enabled"
              name="enabled"
              defaultValue={config?.enabled ? "true" : "false"}
              className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="true">Active & Chatting</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-bot-tone">Personality / Tone</Label>
            <Input id="brand-bot-tone" name="tone" defaultValue={config?.tone ?? "professional, welcoming, collaborative"} />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="brand-bot-welcome">Welcome Message</Label>
            <Input 
              id="brand-bot-welcome" 
              name="welcomeMessage" 
              defaultValue={config?.welcomeMessage ?? "Hey! Let's collaborate. Tell me about your brand and what campaign you have in mind!"} 
            />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="brand-bot-prompt">Sponsorship Guidelines / Instructions</Label>
            <Textarea 
              id="brand-bot-prompt" 
              name="systemPrompt" 
              rows={4}
              defaultValue={config?.systemPrompt ?? "Explain our audience niche focus, mention that our minimum sponsorship rate is $800, and collect their brand name and timeline."} 
              placeholder="Tell the AI assistant how to reply to brands, what rates to pitch, your minimum package requirements, and demographics..."
            />
          </div>
          <div className="flex items-center gap-3 lg:col-span-2">
            <Button disabled={isPending} className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl h-10 px-5">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Sponsor Chatbot
                </>
              )}
            </Button>
            <Badge variant="accent" className="bg-violet-500/10 text-violet-600 border-none font-bold">Dedicated Brand Lane</Badge>
          </div>
        </form>
        {message ? (
          <p className="mt-4 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 px-4 py-2.5 text-xs font-bold">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
