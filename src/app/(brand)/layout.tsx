import { requireWorkspacePermission } from "@/server/auth/requireWorkspacePermission";

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspacePermission("brand");
  return children;
}
