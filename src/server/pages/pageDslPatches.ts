import { validatePageDsl } from "./validatePageDsl";
import type { PageDsl } from "./pageDslSchema";

export type PageDslPatch =
  | { op: "replace_seo"; seo: PageDsl["page"]["seo"] }
  | { op: "replace_theme"; theme: PageDsl["page"]["theme"] }
  | { op: "upsert_block"; block: PageDsl["page"]["blocks"][number] }
  | { op: "remove_block"; id: string; approved: boolean };

export function applyPageDslPatches(dsl: PageDsl, patches: PageDslPatch[]) {
  const next: PageDsl = structuredClone(dsl);

  for (const patch of patches) {
    if (patch.op === "replace_seo") next.page.seo = patch.seo;
    if (patch.op === "replace_theme") next.page.theme = patch.theme;
    if (patch.op === "upsert_block") {
      const index = next.page.blocks.findIndex((block) => block.id === patch.block.id);
      if (index >= 0) next.page.blocks[index] = patch.block;
      else next.page.blocks.push(patch.block);
    }
    if (patch.op === "remove_block") {
      if (!patch.approved) {
        throw new Error("Removing a page block requires approval.");
      }
      next.page.blocks = next.page.blocks.filter((block) => block.id !== patch.id);
    }
  }

  const valid = validatePageDsl(next);
  if (!valid.ok) {
    throw new Error("Page DSL patch produced an invalid page.");
  }

  return valid.data;
}
