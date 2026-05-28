import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import type { ProviderState } from "./types";

export async function getProviderStatus(workspaceId: string, provider: string): Promise<ProviderState> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("provider_connections")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();

  return (data?.status as ProviderState | undefined) ?? "not_configured";
}
