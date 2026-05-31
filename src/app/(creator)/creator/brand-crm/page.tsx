import { AppShell, PageHeader } from "@/components/layout/appShell";
import { BrandCrmClient } from "@/features/brand/components/brandCrmClient";

export const metadata = {
  title: "Brand CRM - KreatorOS",
};

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Brand CRM"
        title="Brand partnerships"
        description="Track applications, chats, work links, and payouts."
      />
      <BrandCrmClient />
    </AppShell>
  );
}
