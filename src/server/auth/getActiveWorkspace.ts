import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createWorkspaceForUser } from "@/server/workspaces/workspaceService";
import { workspaceTypes, type WorkspaceType } from "./permissions";
import type { WorkspaceAccessRecord } from "./routeAccess";

type WorkspaceRow = {
  active_workspace_id?: string | null;
  account_type?: string | null;
  email?: string | null;
  full_name?: string | null;
  preferences?: Record<string, unknown> | null;
  workspace_members?: Array<{
    role: string | null;
    workspaces: {
      id: string;
      type: WorkspaceAccessRecord["type"];
      status: WorkspaceAccessRecord["status"];
    } | null;
  }>;
};

function resolveWorkspaceType(profile: WorkspaceRow): WorkspaceType {
  if (profile.account_type === "business") return "brand";
  if (profile.account_type === "admin") return "admin";
  if (profile.account_type === "creator" || profile.account_type === "user") return "creator";
  
  const preferredAccountType = profile.preferences?.accountType;
  if (preferredAccountType === "business") return "brand";
  if (preferredAccountType === "admin") return "admin";
  if (preferredAccountType === "creator" || preferredAccountType === "user") return "creator";

  const preferredType = profile.preferences?.workspaceType;
  if (typeof preferredType === "string" && workspaceTypes.includes(preferredType as WorkspaceType)) {
    return preferredType as WorkspaceType;
  }

  return "creator";
}

function displayName(profile: WorkspaceRow) {
  const fallback = profile.email?.split("@")[0] || "KreatorOS";
  return profile.full_name || fallback;
}

export async function getActiveWorkspace(userId: string): Promise<WorkspaceAccessRecord | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("active_workspace_id, account_type, email, full_name, preferences, workspace_members(role, workspaces(id, type, status))")
    .eq("id", userId)
    .maybeSingle<WorkspaceRow>();

  if (error || !data) {
    return null;
  }

  const resolveWorkspace = (workspaces: any) => {
    if (Array.isArray(workspaces)) return workspaces[0];
    return workspaces;
  };
  const expectedType = resolveWorkspaceType(data);
  const membershipsForAccount = data.workspace_members?.filter((membership) => {
    const ws = resolveWorkspace(membership.workspaces);
    return ws?.type === expectedType;
  }) ?? [];

  if (!membershipsForAccount.length) {
    const created = await createWorkspaceForUser({
      userId,
      type: expectedType,
      name: `${displayName(data)} ${expectedType === "brand" ? "Brand" : "Creator"}`,
    });

    if (!created.ok) return null;
    return {
      id: created.workspace.id,
      type: created.workspace.type,
      status: created.workspace.status,
      role: "owner",
    };
  }

  const activeMembership =
    membershipsForAccount.find((membership) => {
      const ws = resolveWorkspace(membership.workspaces);
      return ws?.id === data.active_workspace_id;
    }) ?? membershipsForAccount[0];

  const ws = resolveWorkspace(activeMembership.workspaces);
  if (!ws) {
    return null;
  }

  return {
    id: ws.id,
    type: ws.type,
    status: ws.status,
    role: activeMembership.role,
  };
}
