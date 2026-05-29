import { PostHog } from "posthog-node";

type CaptureInput = {
  distinctId?: string | null;
  event: string;
  properties?: Record<string, unknown>;
};

function getPostHogConfig() {
  const token = process.env.POSTHOG_PROJECT_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
  if (!token) return null;

  return {
    token,
    host: process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  };
}

export function isPostHogConfigured() {
  return Boolean(getPostHogConfig());
}

export async function capturePostHogEvent(input: CaptureInput) {
  const config = getPostHogConfig();
  if (!config) return;

  const posthog = new PostHog(config.token, {
    host: config.host,
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    posthog.capture({
      distinctId: input.distinctId || "anonymous",
      event: input.event,
      properties: input.properties ?? {},
    });
  } finally {
    await posthog.shutdown();
  }
}
