import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicLinkPage } from "@/server/linkCommerce/service";
import { getThemeClasses } from "@/features/linkCommerce/components/publicLinkCommerce";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicLinkPage(slug);
  const contact = data.contact;

  const mode = data.page.theme?.mode || "dark";
  const accent = data.page.theme?.accent || "coral";
  const styling = getThemeClasses(mode, accent, data.page.theme?.custom);

  return (
    <main className={`min-h-screen px-4 py-10 ${styling.bgClass}`} style={styling.bgStyle}>
      {data.page.theme?.custom?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: data.page.theme.custom.customCss }} />
      )}
      <div className={`mx-auto max-w-xl rounded-[2rem] border p-6 ${styling.isLight ? 'border-zinc-200/80 bg-white shadow-md text-zinc-900' : 'border-white/10 bg-white/[0.06] text-white'}`} style={styling.cardStyle}>
        <Link href={`/u/${slug}`} className={`text-sm font-black ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>
          Back to profile
        </Link>
        <h1 className="mt-6 text-4xl font-black">Contact {data.page.display_name}</h1>
        <p className={`mt-2 ${styling.textMutedClass}`}>For brand inquiries, collaborations, and support.</p>
        <div className="mt-8 space-y-3">
          {contact?.show_email && contact.email ? (
            <a href={`mailto:${contact.email}`} className={`flex items-center gap-3 rounded-2xl p-4 font-bold ${styling.isLight ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900' : 'bg-white/[0.08] hover:bg-white/[0.12] text-white'}`} style={styling.cardStyle}><Mail className={`h-5 w-5 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} /> {contact.email}</a>
          ) : null}
          {contact?.show_phone && contact.phone ? (
            <a href={`tel:${contact.phone}`} className={`flex items-center gap-3 rounded-2xl p-4 font-bold ${styling.isLight ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900' : 'bg-white/[0.08] hover:bg-white/[0.12] text-white'}`} style={styling.cardStyle}><Phone className={`h-5 w-5 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} /> {contact.phone}</a>
          ) : null}
          {contact?.show_website && contact.website ? (
            <a href={contact.website} className={`flex items-center gap-3 rounded-2xl p-4 font-bold ${styling.isLight ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900' : 'bg-white/[0.08] hover:bg-white/[0.12] text-white'}`} style={styling.cardStyle}>{contact.website}</a>
          ) : null}
          {!contact ? <p className={`rounded-2xl border border-dashed p-6 text-center ${styling.isLight ? 'border-zinc-300 text-zinc-500' : 'border-white/10 text-zinc-400'}`}>Contact details are not published yet.</p> : null}
        </div>
        <Button asChild className={`mt-8 w-full ${styling.buttonClass}`} style={styling.buttonStyle}>
          <Link href={`/u/${slug}`}>Return to Smart Link</Link>
        </Button>
      </div>
    </main>
  );
}
