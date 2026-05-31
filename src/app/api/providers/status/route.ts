import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { cacheGet, cacheSet } from "@/server/redis/cache";
import { getRedisClient } from "@/server/redis/client";

const defaultProviders = [
  { provider: "stripe", label: "Stripe", requiredFor: "Payments and subscriptions" },
  { provider: "google_calendar", label: "Google Calendar", requiredFor: "Calendar events" },
  { provider: "calcom", label: "Cal.com", requiredFor: "Booking webhooks" },
  { provider: "whatsapp", label: "WhatsApp Business", requiredFor: "WhatsApp reminders" },
  { provider: "email", label: "Email", requiredFor: "Transactional email" },
  { provider: "posthog", label: "PostHog Analytics", requiredFor: "Product analytics and tracking" },
  { provider: "redis", label: "Redis Caching", requiredFor: "API rate limiting and caching" },
];

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view provider status.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  // 1. Try to serve from Redis cache to speed up settings load times
  const cacheKey = `workspace_providers:${workspace.id}`;
  try {
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) {
      return apiOk({ workspaceId: workspace.id, providers: cached });
    }
  } catch (err) {
    console.warn("[Redis Cache Warn] Failed to read cached provider statuses:", err);
  }

  // 2. Fallback to Supabase database lookup
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("provider_connections")
    .select("provider,status,capabilities,connected_at,metadata")
    .eq("workspace_id", workspace.id);

  const connections = new Map((data ?? []).map((item) => [item.provider, item]));
  
  // 3. Assemble live status statuses
  const providers = defaultProviders.map((provider) => {
    // Dynamic system-level PostHog status mapping
    if (provider.provider === "posthog") {
      const hasToken = Boolean(process.env.NEXT_PUBLIC_POSTHOG_TOKEN);
      return {
        ...provider,
        status: hasToken ? "connected" : process.env.NODE_ENV === "development" ? "mock_mode" : "not_configured",
        capabilities: ["event_capture", "pageview_tracking"],
        connectedAt: new Date().toISOString(),
        metadata: { proxy: "/k-os-signal" },
      };
    }

    // Dynamic system-level Redis status mapping
    if (provider.provider === "redis") {
      const driver = getRedisClient().getDriverType();
      return {
        ...provider,
        status: driver !== "mock" ? "connected" : "mock_mode",
        capabilities: ["caching", "rate_limiting"],
        connectedAt: new Date().toISOString(),
        metadata: { driver },
      };
    }

    const connection = connections.get(provider.provider);
    return {
      ...provider,
      status: connection?.status ?? "not_configured",
      capabilities: connection?.capabilities ?? [],
      connectedAt: connection?.connected_at ?? null,
      metadata: connection?.metadata ?? {},
    };
  });

  // 4. Save to Redis cache for 30 seconds
  try {
    await cacheSet(cacheKey, providers, 30);
  } catch (err) {
    console.warn("[Redis Cache Warn] Failed to write provider statuses to cache:", err);
  }

  return apiOk({ workspaceId: workspace.id, providers });
}
