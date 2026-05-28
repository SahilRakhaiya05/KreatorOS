import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import type { WorkspaceAccessRecord } from "./routeAccess";

type WorkspaceRow = {
  active_workspace_id?: string | null;
  workspace_members?: Array<{
    role: string | null;
    workspaces: {
      id: string;
      type: WorkspaceAccessRecord["type"];
      status: WorkspaceAccessRecord["status"];
    } | null;
  }>;
};

export async function getActiveWorkspace(userId: string): Promise<WorkspaceAccessRecord | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("active_workspace_id, workspace_members(role, workspaces(id, type, status))")
    .eq("id", userId)
    .maybeSingle<WorkspaceRow>();

  if (error || !data?.workspace_members?.length) {
    return null;
  }

  const activeMembership =
    data.workspace_members.find((membership) => membership.workspaces?.id === data.active_workspace_id) ??
    data.workspace_members[0];

  if (!activeMembership.workspaces) {
    return null;
  }

  return {
    id: activeMembership.workspaces.id,
    type: activeMembership.workspaces.type,
    status: activeMembership.workspaces.status,
    role: activeMembership.role,
  };
}
