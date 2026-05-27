"use client";

import { useActionState } from "react";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { accountTypeOptions } from "../config/accountTypes";
import type { UserProfile } from "../types";
import { logoutAction, updatePasswordAction, updateProfileAction, type ActionState } from "../server/actions";
import { SubmitButton } from "./formStatus";

const initialState: ActionState = { status: "idle", message: "" };

export function ProfileSettingsForm({ profile, email }: { profile: UserProfile | null; email?: string | null }) {
  const [profileState, profileAction] = useActionState(updateProfileAction, initialState);
  const [passwordState, passwordAction] = useActionState(updatePasswordAction, initialState);
  const preferences = profile?.preferences ?? {};

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[.7fr_1.3fr]">
          <div className="rounded-xl border border-border bg-secondary/50 p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-xl">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
                  <UserRound className="h-7 w-7" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-display text-xl font-semibold">{profile?.full_name ?? "Your profile"}</h2>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant={profile?.onboarding_completed ? "success" : "warning"}>
                {profile?.onboarding_completed ? "Onboarded" : "Needs onboarding"}
              </Badge>
              <Badge variant="secondary">{profile?.account_type ?? "No account type"}</Badge>
            </div>
          </div>

          <form action={profileAction} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required defaultValue={profile?.full_name ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input id="avatarUrl" name="avatarUrl" defaultValue={profile?.avatar_url ?? ""} placeholder="https://..." />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Account type</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {accountTypeOptions.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value={option.value}
                      defaultChecked={(profile?.account_type ?? "user") === option.value}
                      className="peer sr-only"
                    />
                    <span className="block rounded-xl border border-border bg-card p-4 text-sm transition peer-checked:border-accent peer-checked:bg-accent/5 peer-checked:ring-1 peer-checked:ring-accent">
                      <span className="font-semibold">{option.label}</span>
                      <span className="mt-1 block leading-6 text-muted-foreground">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="primaryGoal">Primary goal</Label>
                <Input
                  id="primaryGoal"
                  name="primaryGoal"
                  defaultValue={typeof preferences.primaryGoal === "string" ? preferences.primaryGoal : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="audience">Audience/company type</Label>
                <Input
                  id="audience"
                  name="audience"
                  defaultValue={typeof preferences.audience === "string" ? preferences.audience : ""}
                />
              </div>
            </div>

            {profileState.message ? <Status state={profileState} /> : null}
            <SubmitButton idleText="Save profile" pendingText="Saving profile..." />
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Password</CardTitle>
              <p className="text-sm text-muted-foreground">Update your Supabase email/password credential.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form action={passwordAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" type="password" minLength={8} required placeholder="New password" />
              </div>
              {passwordState.message ? <Status state={passwordState} /> : null}
              <SubmitButton idleText="Update password" pendingText="Updating password..." />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Auth settings</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your active session and connected auth providers.</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
              Your session is active and secured. Sign out below to end it on this device.
            </div>
            <form action={logoutAction} className="mt-4">
              <Button type="submit" variant="outline" className="w-full">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Status({ state }: { state: ActionState }) {
  return (
    <div
      className={cn(
        "rounded-md px-3 py-2.5 text-sm font-medium",
        state.status === "error" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent",
      )}
    >
      {state.message}
    </div>
  );
}
