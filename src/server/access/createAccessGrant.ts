import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export async function createAccessGrant(input: {
  workspaceId: string;
  customerId: string;
  offerId?: string | null;
  grantType?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("access_grants")
    .insert({
      workspace_id: input.workspaceId,
      customer_id: input.customerId,
      offer_id: input.offerId ?? null,
      grant_type: input.grantType ?? "offer",
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };

  await writeAuditLog({
    workspaceId: input.workspaceId,
    actorType: "system",
    action: "access.granted",
    targetType: "access_grant",
    targetId: data.id,
    after: data,
  });

  return { ok: true as const, data };
}
