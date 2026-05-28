import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicLinkPage } from "@/server/linkCommerce/service";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicLinkPage(slug);
  const contact = data.contact;

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        <Link href={`/u/${slug}`} className="text-sm font-black text-rose-200">Back to profile</Link>
        <h1 className="mt-6 text-4xl font-black">Contact {data.page.display_name}</h1>
        <p className="mt-2 text-zinc-400">For brand inquiries, collaborations, and support.</p>
        <div className="mt-8 space-y-3">
          {contact?.show_email && contact.email ? (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-2xl bg-white/[0.08] p-4 font-bold"><Mail className="h-5 w-5 text-rose-200" /> {contact.email}</a>
          ) : null}
          {contact?.show_phone && contact.phone ? (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-3 rounded-2xl bg-white/[0.08] p-4 font-bold"><Phone className="h-5 w-5 text-rose-200" /> {contact.phone}</a>
          ) : null}
          {contact?.show_website && contact.website ? (
            <a href={contact.website} className="flex items-center gap-3 rounded-2xl bg-white/[0.08] p-4 font-bold">{contact.website}</a>
          ) : null}
          {!contact ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-zinc-500">Contact details are not published yet.</p> : null}
        </div>
        <Button asChild className="mt-8 w-full bg-rose-400 text-zinc-950 hover:bg-rose-300">
          <Link href={`/u/${slug}`}>Return to Smart Link</Link>
        </Button>
      </div>
    </main>
  );
}
