import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import type { WorkspaceType } from "@/server/auth/permissions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function workspaceTypeToAccountType(type: WorkspaceType) {
  if (type === "brand" || type === "agency") return "business";
  if (type === "admin") return "admin";
  if (type === "creator" || type === "startup" || type === "community") return "creator";
  return "user";
}

export async function createWorkspaceForUser(input: {
  userId: string;
  name: string;
  type: WorkspaceType;
  slug?: string;
  avatarUrl?: string | null;
}) {
  const supabase = hasSupabaseServiceConfig()
    ? createSupabaseServiceClient()
    : await createSupabaseServerClient();
  const baseSlug = slugify(input.slug || input.name) || "workspace";
  const slug = `${baseSlug}-${input.userId.slice(0, 6)}`;

  const { data: existing } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", input.userId)
    .eq("type", input.type)
    .maybeSingle();

  if (existing) {
    // Ensure membership exists and is active
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", existing.id)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (!existingMember) {
      await supabase.from("workspace_members").insert({
        workspace_id: existing.id,
        user_id: input.userId,
        role: "owner",
        status: "active",
      });
    } else if (existingMember.status !== "active") {
      await supabase
        .from("workspace_members")
        .update({ status: "active" })
        .eq("workspace_id", existing.id)
        .eq("user_id", input.userId);
    }

    await supabase.from("profiles").update({ active_workspace_id: existing.id }).eq("id", input.userId);
    return { ok: true as const, workspace: existing, created: false };
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      name: input.name,
      slug,
      type: input.type,
      owner_id: input.userId,
      avatar_url: input.avatarUrl ?? null,
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };

  await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: input.userId,
    role: "owner",
    status: "active",
  });

  await supabase.from("profiles").update({ active_workspace_id: workspace.id }).eq("id", input.userId);

  await writeAuditLog({
    workspaceId: workspace.id,
    ownerId: input.userId,
    actorType: "creator",
    actorId: input.userId,
    action: "workspace.created",
    targetType: "workspace",
    targetId: workspace.id,
    after: workspace,
  });

  return { ok: true as const, workspace, created: true };
}

export async function listUserWorkspaces(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role,status,workspaces(id,name,slug,type,status,plan,avatar_url)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) return [];
  return data ?? [];
}
