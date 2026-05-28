import { z } from "zod";

export const pageBlockDslSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["hero", "link", "calendar", "product", "membership", "lead_magnet", "brand_intake", "ai_concierge"]),
  props: z.record(z.string(), z.unknown()).default({}),
});

export const pageDslSchema = z.object({
  page: z.object({
    theme: z
      .object({
        mode: z.enum(["light", "dark"]).default("light"),
        accent: z.string().min(1).default("emerald"),
        font: z.string().min(1).default("inter"),
        radius: z.string().min(1).default("xl"),
        animation: z.string().min(1).default("subtle"),
      })
      .default({
        mode: "light",
        accent: "emerald",
        font: "inter",
        radius: "xl",
        animation: "subtle",
      }),
    seo: z
      .object({
        title: z.string().min(1).max(80),
        description: z.string().min(1).max(180),
      })
      .partial()
      .default({}),
    blocks: z.array(pageBlockDslSchema).default([]),
  }),
});

export type PageDsl = z.infer<typeof pageDslSchema>;
