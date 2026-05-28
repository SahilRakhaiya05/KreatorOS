import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { requiresHumanApproval } from "@/server/security/riskPolicy";

export async function updateOffer(input: {
  workspaceId: string;
  offerId: string;
  actorId?: string | null;
  update: Record<string, unknown>;
  approved?: boolean;
}) {
  if ("price_cents" in input.update && requiresHumanApproval({ action: "offer.price_changed", targetType: "offer" }) && !input.approved) {
    return { ok: false as const, code: "approval_required", message: "Changing prices requires approval." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("offers").select("*").eq("id", input.offerId).maybeSingle();
  const { data, error } = await supabase.from("offers").update(input.update).eq("id", input.offerId).select("*").single();
  if (error) return { ok: false as const, error };

  await writeAuditLog({
    workspaceId: input.workspaceId,
    actorType: "creator",
    actorId: input.actorId,
    action: "offer.updated",
    targetType: "offer",
    targetId: input.offerId,
    before,
    after: data,
  });

  return { ok: true as const, data };
}
