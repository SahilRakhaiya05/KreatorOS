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

export const workspaceCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.enum(["creator", "brand", "agency", "startup", "community", "admin"]),
});

export const workspaceSwitchSchema = z.object({
  workspaceId: z.string().uuid(),
});

export const offerCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  type: z.enum(["product", "booking", "membership", "course", "service", "brand_package", "lead_magnet", "event", "bundle", "affiliate", "donation"]),
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().min(0).default(0),
  currency: z.string().min(3).max(3).default("usd"),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const offerUpdateSchema = z.object({
  workspaceId: z.string().uuid(),
  update: z.record(z.string(), z.unknown()).default({}),
  approved: z.boolean().default(false),
});

export const eventSchema = z.object({
  type: z.string().min(1),
  workspaceId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  actorType: z.enum(["visitor", "customer", "creator", "brand", "system", "agent", "provider"]),
  actorId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().optional(),
});

export const analyticsTrackSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
  eventType: z.string().min(1),
  visitorId: z.string().optional(),
  sessionId: z.string().optional(),
  referrer: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const pageVersionSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  dsl: z.unknown(),
  changeSummary: z.string().optional(),
});

export const aiSuggestionCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  pageId: z.string().uuid().optional(),
  title: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high"]).default("low"),
  explanation: z.string().optional(),
  patch: z.object({
    targetType: z.enum(["page", "block", "offer", "workflow", "message"]),
    targetId: z.string().optional(),
    operations: z.array(z.record(z.string(), z.unknown())).default([]),
  }),
});

export const assistantConfigSchema = z.object({
  workspaceId: z.string().uuid(),
  pageId: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(["draft", "active", "paused", "archived"]).default("active"),
  tone: z.string().min(1).default("helpful"),
  welcomeMessage: z.string().min(1).optional(),
  systemPrompt: z.string().min(1).optional(),
  knowledgeSummary: z.string().optional(),
  permissions: z.record(z.string(), z.unknown()).optional(),
});

export const publicAssistantChatSchema = z.object({
  pageId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  visitorId: z.string().optional(),
  message: z.string().min(1),
});

export const assistantLeadSchema = z.object({
  pageId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().optional(),
  intent: z.string().optional(),
});
