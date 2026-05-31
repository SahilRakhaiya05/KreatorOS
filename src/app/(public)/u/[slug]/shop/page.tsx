import { PublicShopPage } from "@/features/linkCommerce/components/publicLinkCommerce";
import { getPublicLinkPage } from "@/server/linkCommerce/service";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { link_theme } = await searchParams;
  const linkThemeSlug = typeof link_theme === "string" ? link_theme : undefined;
  
  const data = await getPublicLinkPage(slug, linkThemeSlug);
  return <PublicShopPage data={data} />;
}
