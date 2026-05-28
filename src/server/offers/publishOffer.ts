import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export async function publishOffer(input: {
  workspaceId: string;
  offerId: string;
  actorId?: string | null;
  approved?: boolean;
}) {
  if (!input.approved) {
    return { ok: false as const, code: "approval_required", message: "Publishing an offer requires approval." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("offers")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", input.offerId)
    .select("*")
    .single();

  if (error) return { ok: false as const, error };

  await writeAuditLog({
    workspaceId: input.workspaceId,
    pageId: data.page_id,
    actorType: "creator",
    actorId: input.actorId,
    action: "offer.published",
    targetType: "offer",
    targetId: input.offerId,
    after: data,
  });

  return { ok: true as const, data };
}
