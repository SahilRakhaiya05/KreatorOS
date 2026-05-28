import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { assertServerOnly } from "@/server/security/assertServerOnly";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";

export type AuditLogInput = {
  workspaceId?: string | null;
  pageId?: string | null;
  ownerId?: string | null;
  actorType: "visitor" | "customer" | "creator" | "brand" | "system" | "agent" | "provider";
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditLogInput) {
  assertServerOnly("writeAuditLog");
  const supabase = hasSupabaseServiceConfig() ? createSupabaseServiceClient() : await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      workspace_id: input.workspaceId ?? null,
      page_id: input.pageId ?? null,
      owner_id: input.ownerId ?? null,
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false as const, error };
  }

  return { ok: true as const, auditLogId: data?.id as string | undefined };
}
