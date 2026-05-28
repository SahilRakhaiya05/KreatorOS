import { z } from "zod";

export const aiSuggestionPatchSchema = z.object({
  targetType: z.enum(["page", "block", "offer", "workflow", "message"]),
  targetId: z.string().optional(),
  operations: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const createAiSuggestionSchema = z.object({
  workspaceId: z.string().min(1),
  pageId: z.string().min(1).optional(),
  title: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high"]).default("low"),
  explanation: z.string().optional(),
  patch: aiSuggestionPatchSchema,
});

export type AiSuggestionPatch = z.infer<typeof aiSuggestionPatchSchema>;
