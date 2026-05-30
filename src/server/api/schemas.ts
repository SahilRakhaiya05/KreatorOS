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
      phone: z.string().optional(),
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
  offerId: z.string().uuid().optional(),
  productId: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
  workspaceId: z.string().uuid().optional(),
  couponCode: z.string().min(1).optional(),
  returnUrl: z.string().url().optional(),
  customer: z
    .object({
      email: z.string().email().optional(),
      name: z.string().min(1).optional(),
    })
    .optional(),
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

export const workspaceInviteSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "manager", "editor", "analyst", "member", "viewer", "client", "brand_user"]),
});

export const workspaceMemberUpdateSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "manager", "editor", "analyst", "member", "viewer", "client", "brand_user"]).optional(),
  status: z.enum(["invited", "active", "suspended", "removed"]).optional(),
  permissions: z.record(z.string(), z.unknown()).optional(),
});

export const permissionCheckSchema = z.object({
  workspaceId: z.string().uuid(),
  surface: z.enum(["creator", "brand", "portal", "admin"]),
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

export const instagramCaptureSchema = z.object({
  event: z.literal("instagram.capture.v1"),
  source: z.string().optional(),
  extension: z
    .object({
      name: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
  page: z.object({
    url: z.string(),
    canonicalUrl: z.string().optional(),
    title: z.string().nullable().optional(),
    capturedAt: z.string().datetime().optional(),
    language: z.string().nullable().optional(),
    referrer: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    viewport: z.record(z.string(), z.unknown()).optional(),
  }),
  instagram: z
    .object({
      platform: z.literal("instagram").optional(),
      type: z.string().optional(),
      shortcode: z.string().nullable().optional(),
      username: z.string().nullable().optional(),
      storyId: z.string().nullable().optional(),
      caption: z.string().nullable().optional(),
      thumbnailUrl: z.string().nullable().optional(),
      mediaImageUrls: z.array(z.string()).default([]),
      mediaVideoUrls: z.array(z.string()).default([]),
      openGraph: z.record(z.string(), z.unknown()).default({}),
      twitter: z.record(z.string(), z.unknown()).default({}),
      jsonLd: z.array(z.unknown()).default([]),
      allMeta: z.record(z.string(), z.string()).default({}),
    })
    .default({
      mediaImageUrls: [],
      mediaVideoUrls: [],
      openGraph: {},
      twitter: {},
      jsonLd: [],
      allMeta: {},
    }),
  raw: z
    .object({
      visibleTextSample: z.string().optional(),
      htmlLength: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export const pageVersionSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  dsl: z.unknown(),
  changeSummary: z.string().optional(),
});

export const pageUpdateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  themeName: z.string().min(1).optional(),
  layout: z.string().min(1).optional(),
  bio: z.string().optional(),
  displayName: z.string().min(1).optional(),
  handle: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

export const pageBlockUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  status: z.enum(["live", "draft"]).optional(),
  sortOrder: z.number().int().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  refType: z.string().nullable().optional(),
  refId: z.string().uuid().nullable().optional(),
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

export const assistantKnowledgeSourceSchema = z.object({
  workspaceId: z.string().uuid(),
  assistantId: z.string().uuid(),
  sourceType: z.enum(["page", "offer", "faq", "manual", "file", "url"]),
  title: z.string().min(1),
  content: z.string().optional(),
  sourceRef: z.string().optional(),
  status: z.enum(["active", "disabled", "archived"]).default("active"),
});

export const accessCheckSchema = z.object({
  workspaceId: z.string().uuid(),
  offerId: z.string().uuid(),
  email: z.string().email(),
});

export const catalogCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  offerId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const couponCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  code: z.string().min(1).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().optional(),
  discountType: z.enum(["percent", "amount"]),
  discountValue: z.number().int().min(0),
  expiresAt: z.string().datetime().optional(),
});

export const linkPageProfileSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  displayName: z.string().min(1),
  username: z.string().min(1).regex(/^[a-z0-9-]+$/),
  headline: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  backgroundImageUrl: z.string().url().optional().or(z.literal("")),
  occupationType: z.enum(["personal", "creator", "brand", "business", "agency", "community"]).default("creator"),
  totalFollowers: z.coerce.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "paused"]).optional(),
  themeMode: z.string().optional(),
  themeAccent: z.string().optional(),
});

export const linkSocialLinkSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  platform: z.string().min(1),
  url: z.string().url(),
  label: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  isVisible: z.boolean().default(true),
});

export const linkCustomLinkSchema = z.object({
  id: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  icon: z.string().optional(),
  isVisible: z.boolean().default(true),
});

export const linkGallerySchema = z.object({
  id: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  imageUrl: z.string().url(),
  altText: z.string().optional(),
  caption: z.string().optional(),
});

export const linkContactSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(false),
  showWebsite: z.boolean().default(true),
  showAddress: z.boolean().default(false),
});

export const linkProductSchema = z.object({
  id: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().min(0),
  currency: z.string().min(3).max(3).default("usd"),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  filePath: z.string().optional(),
  externalDeliveryUrl: z.string().url().optional().or(z.literal("")),
  showOnBio: z.boolean().default(true),
  showOnShop: z.boolean().default(true),
  status: z.enum(["draft", "published", "paused", "archived"]).default("draft"),
});

export const linkAffiliateSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  title: z.string().min(1),
  destinationUrl: z.string().url(),
  affiliateCode: z.string().optional(),
  network: z.string().optional(),
  commissionNote: z.string().optional(),
  showOnBio: z.boolean().default(true),
});

export const linkReferralProgramSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  rewardType: z.string().optional(),
  rewardValue: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
});

export const linkTrackSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
  eventType: z.string().min(1),
  visitorId: z.string().optional(),
  refType: z.string().optional(),
  refId: z.string().uuid().optional(),
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const linkAiActionSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  action: z.enum([
    "generate_bio",
    "improve_bio",
    "product_description",
    "pricing_suggestion",
    "product_ideas",
    "page_sections",
    "improve_cta",
    "affiliate_disclosure",
    "brand_inquiry_copy",
    "seo_metadata",
    "conversion_review",
  ]),
  prompt: z.string().optional(),
  context: z.record(z.string(), z.unknown()).default({}),
});
