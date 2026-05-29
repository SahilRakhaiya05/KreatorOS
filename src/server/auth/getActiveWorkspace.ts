import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
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
    status: string | null;
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
  const useService = hasSupabaseServiceConfig();
  const debugLog: string[] = [];
  debugLog.push(`[getActiveWorkspace] userId: ${userId}, useServiceClient: ${useService}`);

  const supabase = useService
    ? createSupabaseServiceClient()
    : await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("active_workspace_id, account_type, email, full_name, preferences, workspace_members:workspace_members!user_id(role, status, workspaces(id, type, status))")
    .eq("id", userId)
    .maybeSingle<WorkspaceRow>();

  if (error) {
    debugLog.push(`[getActiveWorkspace] profile query ERROR: ${error.message} (code: ${error.code})`);
    try { const fs = require("fs"); fs.writeFileSync("workspace-debug.log", debugLog.join("\n"), "utf-8"); } catch {}
    console.log(debugLog.join("\n"));
    return null;
  }
  if (!data) {
    debugLog.push(`[getActiveWorkspace] profile query returned NULL data`);
    try { const fs = require("fs"); fs.writeFileSync("workspace-debug.log", debugLog.join("\n"), "utf-8"); } catch {}
    console.log(debugLog.join("\n"));
    return null;
  }

  debugLog.push(`[getActiveWorkspace] profile found: email=${data.email}, account_type=${data.account_type}, active_workspace_id=${data.active_workspace_id}`);
  debugLog.push(`[getActiveWorkspace] workspace_members count: ${data.workspace_members?.length ?? 0}`);
  debugLog.push(`[getActiveWorkspace] workspace_members raw: ${JSON.stringify(data.workspace_members)}`);

  const resolveWorkspace = (workspaces: any) => {
    if (Array.isArray(workspaces)) return workspaces[0];
    return workspaces;
  };
  const expectedType = resolveWorkspaceType(data);
  debugLog.push(`[getActiveWorkspace] expectedType: ${expectedType}`);

  const membershipsForAccount = data.workspace_members?.filter((membership) => {
    const ws = resolveWorkspace(membership.workspaces);
    const match = ws?.type === expectedType && ws?.status === "active" && membership.status === "active";
    debugLog.push(`[getActiveWorkspace] filter membership: role=${membership.role}, memberStatus=${membership.status}, wsId=${ws?.id}, wsType=${ws?.type}, wsStatus=${ws?.status}, match=${match}`);
    return match;
  }) ?? [];

  debugLog.push(`[getActiveWorkspace] filteredMemberships: ${membershipsForAccount.length}`);

  if (!membershipsForAccount.length) {
    debugLog.push(`[getActiveWorkspace] no matching memberships, calling createWorkspaceForUser...`);
    const created = await createWorkspaceForUser({
      userId,
      type: expectedType,
      name: `${displayName(data)} ${expectedType === "brand" ? "Brand" : "Creator"}`,
    });

    debugLog.push(`[getActiveWorkspace] createWorkspaceForUser result: ok=${created.ok}, workspaceId=${created.ok ? created.workspace.id : "N/A"}, error=${!created.ok ? (created as any).error?.message : "none"}`);

    try { const fs = require("fs"); fs.writeFileSync("workspace-debug.log", debugLog.join("\n"), "utf-8"); } catch {}
    console.log(debugLog.join("\n"));

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
    debugLog.push(`[getActiveWorkspace] resolveWorkspace returned null for activeMembership`);
    try { const fs = require("fs"); fs.writeFileSync("workspace-debug.log", debugLog.join("\n"), "utf-8"); } catch {}
    console.log(debugLog.join("\n"));
    return null;
  }

  debugLog.push(`[getActiveWorkspace] SUCCESS: returning workspace id=${ws.id}, type=${ws.type}, status=${ws.status}, role=${activeMembership.role}`);
  try { const fs = require("fs"); fs.writeFileSync("workspace-debug.log", debugLog.join("\n"), "utf-8"); } catch {}
  console.log(debugLog.join("\n"));

  return {
    id: ws.id,
    type: ws.type,
    status: ws.status,
    role: activeMembership.role,
  };
}

