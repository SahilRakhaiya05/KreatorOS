import { routeSurfaceWorkspaceTypes, type RouteSurface, type WorkspaceType } from "./permissions";

export type AccountType = "user" | "creator" | "business" | "admin";

export type WorkspaceAccessRecord = {
  id: string;
  type: WorkspaceType;
  status: "active" | "suspended" | "archived";
  role?: string | null;
};

export function getRouteSurface(pathname: string): RouteSurface | null {
  if (pathname === "/creator" || pathname.startsWith("/creator/")) return "creator";
  if (pathname === "/brand" || pathname.startsWith("/brand/")) return "brand";
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return "portal";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  return null;
}

export function canWorkspaceAccessSurface(workspace: WorkspaceAccessRecord | null, surface: RouteSurface) {
  if (!workspace || workspace.status !== "active") return false;
  return routeSurfaceWorkspaceTypes[surface].includes(workspace.type);
}

export function canAccountTypeAccessSurface(accountType: AccountType | null | undefined, surface: RouteSurface) {
  if (accountType === "admin") return true;
  if (surface === "portal") return Boolean(accountType);
  if (surface === "creator") return accountType === "creator";
  if (surface === "brand") return accountType === "business";
  return false;
}
