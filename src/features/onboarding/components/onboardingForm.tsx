"use client";

import { useActionState } from "react";
import { Sparkles, Target, UserRound, Compass, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserProfile } from "../../auth/types";
import { completeOnboardingAction, type ActionState } from "../../auth/server/actions";
import { SubmitButton } from "../../auth/components/formStatus";

const initialState: ActionState = { status: "idle", message: "" };

function OnboardingIllustration() {
  return (
    <svg viewBox="0 0 320 320" fill="none" className="h-auto w-full max-w-sm" role="img" aria-label="Workspace illustration">
      <defs>
        <linearGradient id="ob-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(var(--accent))" stopOpacity="0.18" />
          <stop offset="1" stopColor="hsl(var(--accent))" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="url(#ob-a)" />
      <rect x="64" y="78" width="192" height="132" rx="16" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="64" y="78" width="192" height="30" rx="16" fill="hsl(var(--secondary))" />
      <circle cx="82" cy="93" r="4" fill="hsl(var(--accent))" />
      <circle cx="98" cy="93" r="4" fill="hsl(var(--border))" />
      <circle cx="114" cy="93" r="4" fill="hsl(var(--border))" />
      <rect x="82" y="126" width="84" height="10" rx="5" fill="hsl(var(--foreground))" opacity="0.85" />
      <rect x="82" y="146" width="140" height="8" rx="4" fill="hsl(var(--muted-foreground))" opacity="0.4" />
      <rect x="82" y="162" width="120" height="8" rx="4" fill="hsl(var(--muted-foreground))" opacity="0.3" />
      <rect x="82" y="182" width="64" height="16" rx="8" fill="hsl(var(--primary))" />
      <g transform="translate(206 150)">
        <rect x="0" y="0" width="74" height="92" rx="14" fill="hsl(var(--primary))" />
        <path d="M37 22l4.2 9.6 10.3.9-7.8 6.8 2.4 10-9.1-5.4-9.1 5.4 2.4-10-7.8-6.8 10.3-.9z" fill="hsl(var(--accent))" />
        <rect x="16" y="58" width="42" height="7" rx="3.5" fill="white" opacity="0.85" />
        <rect x="22" y="71" width="30" height="6" rx="3" fill="white" opacity="0.4" />
      </g>
    </svg>
  );
}

export function OnboardingForm({ profile }: { profile?: UserProfile | null }) {
  const [state, action] = useActionState(completeOnboardingAction, initialState);
  const preferences = profile?.preferences ?? {};

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Empty-state hero: illustration + heading + sentence + the single CTA lives in the form */}
      <section className="relative hidden items-center justify-center overflow-hidden border-r border-border bg-secondary/30 p-12 lg:flex">
        <div className="dotted-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex max-w-md flex-col items-center text-center">
          <OnboardingIllustration />
          <Badge variant="accent" className="mt-8 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to KreatorOS
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance">
            Let’s set up your workspace.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Answer a few quick questions and your AI operator will tailor your dashboard, offers, and page to fit your work.
          </p>
        </div>
      </section>

      {/* Questions */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Badge variant="accent" className="mb-3 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Welcome to KreatorOS
            </Badge>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Let’s set up your workspace.</h1>
            <p className="mt-2 text-sm text-muted-foreground">A few quick questions to tailor everything to you.</p>
          </div>
          <h1 className="hidden font-display text-2xl font-semibold tracking-tight lg:block">Tell us about you</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground lg:block">This stays editable in Profile settings.</p>

          <form action={action} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <UserRound className="h-4 w-4" /> Your name
              </Label>
              <Input id="fullName" name="fullName" required defaultValue={profile?.full_name ?? ""} placeholder="Aarav Mehta" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="workspaceType" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Workspace type
              </Label>
              <Select name="workspaceType" defaultValue={typeof preferences.workspaceType === "string" ? preferences.workspaceType : "creator"}>
                <SelectTrigger id="workspaceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="focus" className="flex items-center gap-2">
                <Compass className="h-4 w-4" /> What do you do?
              </Label>
              <Input
                id="focus"
                name="focus"
                defaultValue={typeof preferences.focus === "string" ? preferences.focus : ""}
                placeholder="e.g. AI productivity mentor, designer, coach"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="audience" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Who is your audience?
              </Label>
              <Input
                id="audience"
                name="audience"
                defaultValue={typeof preferences.audience === "string" ? preferences.audience : ""}
                placeholder="Founders, students, brand buyers..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primaryGoal" className="flex items-center gap-2">
                <Target className="h-4 w-4" /> Your main goal right now
              </Label>
              <Input
                id="primaryGoal"
                name="primaryGoal"
                defaultValue={typeof preferences.primaryGoal === "string" ? preferences.primaryGoal : ""}
                placeholder="Book more paid calls"
              />
            </div>

            {state.message ? (
              <div
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  state.status === "error" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                )}
              >
                {state.message}
              </div>
            ) : null}

            <SubmitButton idleText="Enter my workspace" pendingText="Setting things up..." />
          </form>
        </div>
      </section>
    </main>
  );
}
