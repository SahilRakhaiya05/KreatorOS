import { z } from "zod";

export const agentRequestSchema = z.object({
  workspaceId: z.string().min(1),
  userMessage: z.string().min(1),
  mode: z.enum(["draft", "execute"]).default("draft"),
});

export const bookingHoldSchema = z.object({
  eventTypeId: z.string().min(1).optional(),
  creatorId: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  customer: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      timezone: z.string().min(1).optional(),
    })
    .optional(),
}).passthrough();

export const workflowSchema = z.object({
  name: z.string().min(1).optional(),
  trigger: z.string().min(1).optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
}).passthrough();

export const checkoutSchema = z.object({
  productId: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
  workspaceId: z.string().min(1).optional(),
}).passthrough();

export const campaignSchema = z.object({
  brandId: z.string().min(1).optional(),
  objective: z.string().min(1).optional(),
  budget: z.union([z.string(), z.number()]).optional(),
}).passthrough();

export const researchStudySchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  participants: z.array(z.unknown()).optional(),
}).passthrough();

export const calendarEventSchema = z.object({
  provider: z.enum(["google", "microsoft", "calcom", "calendly"]).optional(),
  title: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
}).passthrough();

export const whatsappMessageSchema = z.object({
  to: z.string().min(1).optional(),
  templateId: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
}).passthrough();
