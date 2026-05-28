import { requireWorkspacePermission } from "@/server/auth/requireWorkspacePermission";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspacePermission("portal");
  return children;
}
