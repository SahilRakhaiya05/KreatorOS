import Link from "next/link";
import { ShoppingBag, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCheckoutButton } from "@/features/linkCommerce/components/productCheckoutButton";
import { getPublicLinkPage } from "@/server/linkCommerce/service";
import { getThemeClasses } from "@/features/linkCommerce/components/publicLinkCommerce";

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

  const mode = data.page.theme?.mode || "dark";
  const accent = data.page.theme?.accent || "coral";
  const styling = getThemeClasses(mode, accent, data.page.theme?.custom);

  // Dynamic focus classes for checkout inputs based on chosen accent
  let focusClass = "focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50";
  if (accent === "rose") {
    focusClass = "focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50";
  } else if (accent === "emerald") {
    focusClass = "focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50";
  } else if (accent === "indigo") {
    focusClass = "focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50";
  } else if (accent === "amber") {
    focusClass = "focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50";
  }

  return (
    <main className={`min-h-screen ${styling.bgClass}`} style={styling.bgStyle}>
      {data.page.theme?.custom?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: data.page.theme.custom.customCss }} />
      )}
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_380px]">
        <section>
          <Link href={`/u/${slug}/shop`} className={`text-sm font-black ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>
            Back to shop
          </Link>
          <div className={`mt-6 grid aspect-[16/10] place-items-center overflow-hidden rounded-[2rem] border ${styling.isLight ? 'border-zinc-200 bg-white shadow-sm' : 'border-white/10 bg-white/[0.06]'}`}>
            {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className={`h-12 w-12 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />}
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-tight">{product.title}</h1>
          <p className={`mt-4 max-w-2xl text-lg leading-8 ${styling.textMutedClass}`}>{product.description}</p>
        </section>
        <aside className={`h-fit rounded-[2rem] border p-6 ${styling.isLight ? 'border-zinc-200 bg-white shadow-md text-zinc-900' : 'border-white/10 bg-white/[0.06] text-white'}`} style={styling.cardStyle}>
          <p className={`text-sm font-black uppercase tracking-[0.2em] ${styling.textMutedClass}`}>Instant access</p>
          <p className="mt-3 text-4xl font-black">{money(product.price_cents, product.currency)}</p>
          <div className="mt-6">
            <ProductCheckoutButton
              workspaceId={data.page.workspace_id}
              offerId={product.offer_id}
              buttonClass={styling.buttonClass}
              buttonStyle={styling.buttonStyle}
              focusClass={focusClass}
              isLight={styling.isLight}
            />
          </div>
          <div className={`mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm ${styling.isLight ? 'bg-zinc-50 border border-zinc-200/60 text-zinc-600' : 'bg-black/25 text-zinc-400'}`}>
            <ShieldCheck className={`h-5 w-5 shrink-0 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />
            Paid files unlock only after payment success. CreatorOS never stores card details.
          </div>
        </aside>
      </div>
    </main>
  );
}
