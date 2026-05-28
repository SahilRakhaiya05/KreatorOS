import { AppShell } from "@/components/layout/appShell";
import { LinkCommerceStudio } from "@/features/linkCommerce/components/linkCommerceStudio";
import { getCreatorLinkWorkspace } from "@/server/linkCommerce/service";

export default async function Page() {
  const data = await getCreatorLinkWorkspace();
  return (
    <AppShell role="creator">
      <LinkCommerceStudio data={data} mode="assistant" />
    </AppShell>
  );
}
