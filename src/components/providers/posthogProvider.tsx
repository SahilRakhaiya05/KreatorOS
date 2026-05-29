"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_TOKEN) return;

    const query = searchParams.toString();
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

function PostHogIdentity() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_TOKEN) return;

    let cancelled = false;

    async function identifyCurrentUser() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (!response.ok || cancelled) return;

        const payload = await response.json();
        const data = payload?.data;
        const userId = data?.user?.id;
        if (!userId) return;

        posthog.identify(userId, {
          email: data.profile?.email ?? data.user?.email,
          name: data.profile?.full_name,
          account_type: data.profile?.account_type,
          active_workspace_id: data.activeWorkspace?.id,
          active_workspace_type: data.activeWorkspace?.type,
          workspace_role: data.activeWorkspace?.role,
        });
      } catch {
        // Anonymous visitors should keep browsing even if identity lookup fails.
      }
    }

    void identifyCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentity />
      {children}
    </PHProvider>
  );
}
