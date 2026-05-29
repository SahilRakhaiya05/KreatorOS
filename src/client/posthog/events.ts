"use client";

import posthog from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function captureClientEvent(event: string, properties: AnalyticsProperties = {}) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_TOKEN) return;
  posthog.capture(event, properties);
}

export const analyticsEvents = {
  authStarted: "auth.started",
  authSucceeded: "auth.succeeded",
  authFailed: "auth.failed",
  onboardingSubmitted: "onboarding.submitted",
  chatMessageSent: "chat.message_sent",
  chatResponseCompleted: "chat.response_completed",
  chatResponseFailed: "chat.response_failed",
  publicLinkClicked: "public_link.clicked",
};
