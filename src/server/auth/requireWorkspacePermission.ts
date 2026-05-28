import { redirect } from "next/navigation";

import { getSession } from "./getSession";
import { getActiveWorkspace } from "./getActiveWorkspace";
import { canWorkspaceAccessSurface, type WorkspaceAccessRecord } from "./routeAccess";
import type { RouteSurface } from "./permissions";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createWorkspaceForUser } from "@/server/workspaces/workspaceService";

function defaultWorkspaceTypeForSurface(surface: RouteSurface) {
  if (surface === "brand") return "brand" as const;
  if (surface === "admin") return "admin" as const;
  return "creator" as const;
}

export async function requireWorkspacePermission(surface: RouteSurface): Promise<WorkspaceAccessRecord> {
  const { user } = await getSession();

  if (!user) {
    redirect(`/login?next=/${surface}`);
  }

  let workspace = await getActiveWorkspace(user.id);

  if (!workspace) {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,email,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const created = await createWorkspaceForUser({
      userId: user.id,
      name: `${profile?.full_name || profile?.email?.split("@")[0] || "KreatorOS"} Workspace`,
      type: defaultWorkspaceTypeForSurface(surface),
      avatarUrl: profile?.avatar_url ?? null,
    });

    if (created.ok) {
      workspace = {
        id: created.workspace.id,
        type: created.workspace.type,
        status: created.workspace.status,
        role: "owner",
      };
    }
  }

  if (!workspace || !canWorkspaceAccessSurface(workspace, surface)) {
    redirect(`/unauthorized?next=/${surface}`);
  }

  return workspace;
}
