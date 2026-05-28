import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { validatePageDsl } from "./validatePageDsl";

export async function createPageVersion(input: {
  workspaceId?: string | null;
  pageId: string;
  createdBy?: string | null;
  createdByType: "creator" | "agent" | "system";
  dsl: unknown;
  changeSummary?: string;
}) {
  const valid = validatePageDsl(input.dsl);
  if (!valid.ok) {
    return { ok: false as const, error: valid.issues };
  }

  const supabase = await createSupabaseServerClient();
  const { data: latest } = await supabase
    .from("page_versions")
    .select("version_number")
    .eq("page_id", input.pageId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = Number(latest?.version_number ?? 0) + 1;
  const { data, error } = await supabase
    .from("page_versions")
    .insert({
      workspace_id: input.workspaceId ?? null,
      page_id: input.pageId,
      version_number: versionNumber,
      dsl: valid.data,
      created_by: input.createdBy ?? null,
      created_by_type: input.createdByType,
      change_summary: input.changeSummary ?? null,
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };

  await writeAuditLog({
    workspaceId: input.workspaceId,
    pageId: input.pageId,
    actorType: input.createdByType === "agent" ? "agent" : "creator",
    actorId: input.createdBy ?? input.createdByType,
    action: "page.version.created",
    targetType: "page_version",
    targetId: data.id,
    after: data,
  });

  return { ok: true as const, data };
}
