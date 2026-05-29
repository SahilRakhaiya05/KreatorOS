"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { analyticsEvents, captureClientEvent } from "@/client/posthog/events";
import { createSupabaseBrowserClient } from "../../../client/supabase/browserClient";

type AuthMode = "signin" | "signup";

const googleScopes = "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const next = searchParams.get("next") ?? "/onboarding";

  const copy = useMemo(
    () =>
      mode === "signin"
        ? {
            title: "Sign in",
            text: "Welcome back to your AI business operator.",
            button: "Sign in",
            switchText: "Do not have an account?",
            switchAction: "Create one",
          }
        : {
            title: "Create account",
            text: "One login, one selected role, and the right dashboard for that role.",
            button: "Create account",
            switchText: "Already have an account?",
            switchAction: "Sign in",
          },
    [mode],
  );

  async function handleEmailSubmit(formData: FormData) {
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const fullName = String(formData.get("fullName") ?? "").trim();
      captureClientEvent(analyticsEvents.authStarted, { method: "email", mode });

      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { full_name: fullName },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
              },
            });

      if (result.error) {
        captureClientEvent(analyticsEvents.authFailed, {
          method: "email",
          mode,
          error: result.error.message,
        });
        setStatus("error");
        setMessage(result.error.message);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        captureClientEvent(analyticsEvents.authSucceeded, { method: "email", mode, requires_email_confirmation: true });
        setStatus("success");
        setMessage("Check your email to confirm your account, then continue onboarding.");
        return;
      }

      captureClientEvent(analyticsEvents.authSucceeded, { method: "email", mode, requires_email_confirmation: false });
      setStatus("success");
      setMessage("Authenticated. Taking you to onboarding...");
      router.push(next);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to connect to Supabase Auth.");
    }
  }

  function handleGoogleSignIn() {
    setStatus("loading");
    setMessage("");

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        captureClientEvent(analyticsEvents.authStarted, { method: "google", mode });
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
            scopes: googleScopes,
          },
        });

        if (error) {
          captureClientEvent(analyticsEvents.authFailed, {
            method: "google",
            mode,
            error: error.message,
          });
          setStatus("error");
          setMessage(error.message);
        }
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to sign in with Google.");
      }
    });
  }

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85"
          alt="Clean desk with a laptop and notes"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/40 to-accent/40" />
        <div className="absolute left-8 top-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl">
          <Sparkles className="h-4 w-4" />
          KreatorOS
        </div>
        <div className="absolute bottom-8 left-8 right-8 rounded-xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <Sparkles className="h-4 w-4" />
            Unified account
          </p>
          <h2 className="mt-3 max-w-md font-display text-2xl font-semibold tracking-tight">
            One login for creator, business, and client work.
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/85">
            Choose your account type after auth, then change it any time from profile settings.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
        <div className="w-full max-w-md">
         
          <h1 className="font-display text-4xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{copy.text}</p>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={status === "loading" || isPending}
            className="mt-7 w-full"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full text-base font-semibold">G</span>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or continue with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form action={handleEmailSubmit} className="space-y-4">
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="fullName" name="fullName" required placeholder="Full name" className="pl-9" />
                </div>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" required placeholder="you@example.com" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Password"
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {message ? (
              <div
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  status === "error" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent",
                )}
              >
                {message}
              </div>
            ) : null}

            <Button type="submit" disabled={status === "loading"} className="group w-full">
              {status === "loading" ? "Working..." : copy.button}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {copy.switchText}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage("");
                setStatus("idle");
              }}
              className="font-semibold text-accent hover:underline"
            >
              {copy.switchAction}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
