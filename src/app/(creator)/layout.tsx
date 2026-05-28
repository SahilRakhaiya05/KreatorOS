import { requireWorkspacePermission } from "@/server/auth/requireWorkspacePermission";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspacePermission("creator");
  return children;
}
