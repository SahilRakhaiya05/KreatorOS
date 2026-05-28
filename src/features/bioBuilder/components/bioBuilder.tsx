import { BioBuilderClient, PublicPreview } from "@/features/bioBuilder/components/bioBuilderClient";
import { getBuilderPageData } from "@/server/pageBuilder/pageBuilderService";

const themes = [
  { name: "Studio", bg: "from-[#f7f7f2] via-white to-[#ecfdf5]", button: "bg-stone-950" },
  { name: "Editorial", bg: "from-[#efece3] via-white to-[#f8fafc]", button: "bg-stone-900" },
  { name: "Research", bg: "from-[#f1f5f9] via-white to-[#dcfce7]", button: "bg-emerald-800" },
  { name: "Minimal", bg: "from-white via-[#fafaf8] to-[#f4f4ef]", button: "bg-neutral-950" }
];

export async function BioBuilder() {
  const { page, blocks } = await getBuilderPageData();

  return <BioBuilderClient page={page} pageBlocks={blocks} themes={themes} />;
}

export { PublicPreview };
