export const workspaceTypes = ["creator", "brand", "agency", "startup", "community", "admin"] as const;
export type WorkspaceType = (typeof workspaceTypes)[number];

export const workspaceRoles = [
  "owner",
  "admin",
  "manager",
  "editor",
  "analyst",
  "member",
  "viewer",
  "client",
  "brand_user",
] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export type RouteSurface = "creator" | "brand" | "portal" | "admin";

export const routeSurfaceWorkspaceTypes: Record<RouteSurface, WorkspaceType[]> = {
  creator: ["creator", "agency", "startup", "community", "admin"],
  brand: ["brand", "agency", "admin"],
  portal: ["creator", "brand", "agency", "startup", "community", "admin"],
  admin: ["admin"],
};

export const elevatedWorkspaceRoles: WorkspaceRole[] = ["owner", "admin", "manager", "editor"];
