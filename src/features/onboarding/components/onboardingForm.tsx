"use client";

import { useActionState } from "react";
import { CheckCircle2, ImageIcon, Sparkles, Target, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountTypeOptions } from "../../auth/config/accountTypes";
import type { UserProfile } from "../../auth/types";
import { completeOnboardingAction, type ActionState } from "../../auth/server/actions";
import { SubmitButton } from "../../auth/components/formStatus";

const initialState: ActionState = { status: "idle", message: "" };

export function OnboardingForm({ profile }: { profile?: UserProfile | null }) {
  const [state, action] = useActionState(completeOnboardingAction, initialState);
  const selectedAccountType = profile?.account_type ?? "creator";
  const preferences = profile?.preferences ?? {};

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[.82fr_1.18fr]">
        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-xl border border-border shadow-soft">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1100&q=85"
              alt="Modern creator workspace with warm lighting"
              className="h-[600px] w-full object-cover"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {["Auth success", "Complete profile", "Choose type", "Preferences", "Dashboard"].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2 text-xs font-medium text-muted-foreground"
              >
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full text-[10px]",
                    index === 0 ? "bg-accent text-accent-foreground" : "bg-card text-foreground",
                  )}
                >
                  {index === 0 ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <div className="mb-8">
            <Badge variant="accent" className="mb-3 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Unified onboarding
            </Badge>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Set up your KreatorOS profile.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This is one account. Your account type controls the first dashboard and can be changed later from Profile Settings.
            </p>
          </div>

          <form action={action} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Full name
                </Label>
                <Input id="fullName" name="fullName" required defaultValue={profile?.full_name ?? ""} placeholder="Aarav Creator" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avatarUrl" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Avatar URL
                </Label>
                <Input id="avatarUrl" name="avatarUrl" defaultValue={profile?.avatar_url ?? ""} placeholder="https://..." />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Choose account type</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {accountTypeOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <label key={option.value} className="group cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value={option.value}
                        defaultChecked={selectedAccountType === option.value}
                        className="peer sr-only"
                      />
                      <span className="flex min-h-32 gap-4 rounded-xl border border-border bg-card p-4 transition peer-checked:border-accent peer-checked:bg-accent/5 peer-checked:ring-1 peer-checked:ring-accent group-hover:-translate-y-0.5">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="font-semibold">{option.label}</span>
                          <span className="mt-1 block text-sm leading-6 text-muted-foreground">{option.description}</span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="primaryGoal" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Primary goal
                </Label>
                <Input
                  id="primaryGoal"
                  name="primaryGoal"
                  defaultValue={typeof preferences.primaryGoal === "string" ? preferences.primaryGoal : ""}
                  placeholder="Book more paid calls"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="audience">Audience or company type</Label>
                <Input
                  id="audience"
                  name="audience"
                  defaultValue={typeof preferences.audience === "string" ? preferences.audience : ""}
                  placeholder="Founders, students, brand buyers..."
                />
              </div>
            </div>

            {state.message ? (
              <div
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  state.status === "error" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent",
                )}
              >
                {state.message}
              </div>
            ) : null}

            <SubmitButton idleText="Finish onboarding" pendingText="Saving profile..." />
          </form>
        </div>
      </section>
    </main>
  );
}
