import { PublicPreview } from "@/features/bioBuilder/components/bioBuilder";
import { ButtonLink } from "@/components/ui";
export default function PublicPage(){return <main className="min-h-screen bg-[#f7f7f4] p-6"><div className="mx-auto flex max-w-5xl flex-col items-center gap-6 py-10"><PublicPreview/><ButtonLink href="/creator/preview" variant="light">Back to preview studio</ButtonLink></div></main>}
