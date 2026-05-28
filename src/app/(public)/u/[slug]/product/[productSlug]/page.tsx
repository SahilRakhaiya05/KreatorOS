import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCheckoutButton } from "@/features/linkCommerce/components/productCheckoutButton";
import { getPublicLinkPage } from "@/server/linkCommerce/service";

function money(cents = 0, currency = "usd") {
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function Page({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  const data = await getPublicLinkPage(slug);
  const product = data.products.find((item) => item.slug === productSlug && item.status === "published");

  if (!product) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-white">
        <div className="max-w-sm text-center">
          <h1 className="text-3xl font-black">Product unavailable</h1>
          <Button asChild className="mt-5"><Link href={`/u/${slug}/shop`}>Back to shop</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_380px]">
        <section>
          <Link href={`/u/${slug}/shop`} className="text-sm font-black text-rose-200">Back to shop</Link>
          <div className="mt-6 grid aspect-[16/10] place-items-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06]">
            {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-12 w-12 text-zinc-500" />}
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-tight">{product.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">{product.description}</p>
        </section>
        <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Instant access</p>
          <p className="mt-3 text-4xl font-black">{money(product.price_cents, product.currency)}</p>
          <div className="mt-6">
            <ProductCheckoutButton workspaceId={data.page.workspace_id} offerId={product.offer_id} />
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-black/25 p-4 text-sm text-zinc-400">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            Paid files unlock only after payment success. CreatorOS never stores card details.
          </div>
        </aside>
      </div>
    </main>
  );
}
