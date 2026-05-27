import { creator, pageBlocks } from "@/shared/mock/data";
import { BioBuilderClient, PublicPreview } from "@/features/bioBuilder/components/bioBuilderClient";

const themes = [
  { name: "Askiva Mint", bg: "from-[#d9fbef] via-white to-[#efe7ff]", button: "bg-slate-950" },
  { name: "Creator Dark", bg: "from-slate-950 via-slate-800 to-violet-900", button: "bg-violet-600" },
  { name: "Warm Studio", bg: "from-[#fff7cf] via-white to-[#ffe3dc]", button: "bg-orange-600" },
  { name: "Clean SaaS", bg: "from-[#d7f7ff] via-white to-[#f8fafc]", button: "bg-sky-600" }
];

export function BioBuilder() {
  return <BioBuilderClient creator={creator} pageBlocks={pageBlocks} themes={themes} />;
}

export { PublicPreview };
