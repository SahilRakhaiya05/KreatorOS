import { notFound, redirect } from "next/navigation";

import { getSession } from "./getSession";
import { getActiveWorkspace } from "./getActiveWorkspace";
import { canWorkspaceAccessSurface, type WorkspaceAccessRecord } from "./routeAccess";
import type { RouteSurface } from "./permissions";

export async function requireWorkspacePermission(surface: RouteSurface): Promise<WorkspaceAccessRecord> {
  const { user } = await getSession();

  if (!user) {
    redirect(`/login?next=/${surface}`);
  }

  const workspace = await getActiveWorkspace(user.id);

  if (!workspace || !canWorkspaceAccessSurface(workspace, surface)) {
    notFound();
  }

  return workspace;
}
