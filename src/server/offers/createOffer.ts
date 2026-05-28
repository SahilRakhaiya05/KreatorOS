import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import type { OfferType } from "./types";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "offer";
}

export async function createOffer(input: {
  workspaceId: string;
  pageId?: string | null;
  ownerId?: string | null;
  type: OfferType;
  title: string;
  description?: string | null;
  priceCents?: number;
  currency?: string;
  config?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  const row = {
    workspace_id: input.workspaceId,
    page_id: input.pageId ?? null,
    owner_id: input.ownerId ?? null,
    type: input.type,
    title: input.title,
    slug: slugify(input.title),
    description: input.description ?? null,
    price_cents: input.priceCents ?? 0,
    currency: input.currency ?? "usd",
    config: input.config ?? {},
  };

  const { data, error } = await supabase.from("offers").insert(row).select("*").single();
  if (error) return { ok: false as const, error };

  await writeAuditLog({
    workspaceId: input.workspaceId,
    pageId: input.pageId,
    ownerId: input.ownerId,
    actorType: "creator",
    actorId: input.ownerId,
    action: "offer.created",
    targetType: "offer",
    targetId: data.id,
    after: data,
  });

  return { ok: true as const, data };
}
