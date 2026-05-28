import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicPreview } from "@/features/bioBuilder/components/bioBuilder";
import { Button } from "@/components/ui/button";
import { getPublicCreatorPage } from "@/server/pageBuilder/pageBuilderService";

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { page, blocks } = await getPublicCreatorPage(slug);

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10">
        <div className="w-full overflow-hidden rounded-3xl shadow-[0_24px_70px_rgba(28,25,23,.14)]">
          <PublicPreview page={page} blocks={blocks} />
        </div>
        <Button asChild variant="outline">
          <Link href="/creator/builder">
            <ArrowLeft className="h-4 w-4" /> Back to builder
          </Link>
        </Button>
      </div>
    </main>
  );
}
