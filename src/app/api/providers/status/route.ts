import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

const defaultProviders = [
  { provider: "stripe", label: "Stripe", requiredFor: "Payments and subscriptions" },
  { provider: "google_calendar", label: "Google Calendar", requiredFor: "Calendar events" },
  { provider: "calcom", label: "Cal.com", requiredFor: "Booking webhooks" },
  { provider: "whatsapp", label: "WhatsApp Business", requiredFor: "WhatsApp reminders" },
  { provider: "email", label: "Email", requiredFor: "Transactional email" },
];

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view provider status.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("provider_connections")
    .select("provider,status,capabilities,connected_at,metadata")
    .eq("workspace_id", workspace.id);

  const connections = new Map((data ?? []).map((item) => [item.provider, item]));
  const providers = defaultProviders.map((provider) => {
    const connection = connections.get(provider.provider);
    return {
      ...provider,
      status: connection?.status ?? "not_configured",
      capabilities: connection?.capabilities ?? [],
      connectedAt: connection?.connected_at ?? null,
      metadata: connection?.metadata ?? {},
    };
  });

  return apiOk({ workspaceId: workspace.id, providers });
}
