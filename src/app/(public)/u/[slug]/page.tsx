import { PublicPreview } from "@/features/bioBuilder/components/bioBuilder";
import { PublicAssistantWidget } from "@/features/assistant/components/publicAssistantWidget";
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
      </div>
      <PublicAssistantWidget pageId={page.id} welcomeMessage="Tell me your goal and I will recommend the best next step from this creator." />
    </main>
  );
}
