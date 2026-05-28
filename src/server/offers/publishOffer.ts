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

  if (data.page_id) {
    const blockType = data.type === "booking" || data.type === "service"
      ? "calendar"
      : data.type === "membership"
        ? "membership"
        : data.type === "lead_magnet"
          ? "lead_magnet"
          : "product";
    const price = new Intl.NumberFormat("en", {
      style: "currency",
      currency: String(data.currency).toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Number(data.price_cents ?? 0) / 100);

    const { data: existingBlock } = await supabase
      .from("creator_page_blocks")
      .select("id")
      .eq("page_id", data.page_id)
      .eq("ref_type", "offer")
      .eq("ref_id", data.id)
      .maybeSingle();

    const blockPayload = {
      workspace_id: input.workspaceId,
      page_id: data.page_id,
      type: blockType,
      title: data.title,
      subtitle: data.description || price,
      status: "live",
      metadata: { price, offerType: data.type, offerSlug: data.slug },
      ref_type: "offer",
      ref_id: data.id,
    };

    if (existingBlock) {
      await supabase.from("creator_page_blocks").update(blockPayload).eq("id", existingBlock.id);
    } else {
      const { count } = await supabase
        .from("creator_page_blocks")
        .select("id", { count: "exact", head: true })
        .eq("page_id", data.page_id);
      await supabase.from("creator_page_blocks").insert({ ...blockPayload, sort_order: count ?? 0 });
    }
  }

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
