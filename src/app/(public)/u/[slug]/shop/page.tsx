import { PublicShopPage } from "@/features/linkCommerce/components/publicLinkCommerce";
import { getPublicLinkPage } from "@/server/linkCommerce/service";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicLinkPage(slug);
  return <PublicShopPage data={data} />;
}
