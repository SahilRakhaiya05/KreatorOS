import { generateObject } from "ai";
import { z } from "zod";
import { isProviderConfigured, resolveModel } from "@/server/ai/providers";
import type { AgentResult } from "./types";

const agentResultSchema = z.object({
  status: z.enum(["draft_ready", "needs_approval", "failed"]),
  assistantMessage: z.string().min(1),
  proposedToolCalls: z.array(z.string()).min(1).max(6),
  riskLevel: z.enum(["low", "medium", "high"]),
  suggestionTitle: z.string().min(1),
  targetType: z.enum(["page", "block", "offer", "workflow", "message"]),
  operations: z.array(z.record(z.string(), z.unknown())).min(1).max(8),
});

export type AgentKind =
  | "orchestrator"
  | "setup"
  | "bio_builder"
  | "pricing"
  | "offer"
  | "growth"
  | "booking"
  | "automation"
  | "analytics"
  | "product";

export interface AgentRunInput {
  kind: AgentKind;
  userMessage: string;
  mode?: "draft" | "execute";
  workspaceContext?: Record<string, unknown>;
}

const agentBriefs: Record<AgentKind, string> = {
  orchestrator: "Coordinate creator and brand business tasks across offers, pages, bookings, workflows, CRM, and approvals.",
  setup: "Draft workspace setup, creator page structure, starter offers, and onboarding actions.",
  bio_builder: "Write creator bio, positioning, page sections, CTAs, and block-level copy changes.",
  pricing: "Analyze offer pricing, bundles, upsells, tiers, and checkout psychology.",
  offer: "Create monetization offers including products, bookings, memberships, courses, services, and lead magnets.",
  growth: "Draft conversion experiments, CTA tests, campaigns, and audience growth actions.",
  booking: "Design booking funnels, qualification, calendar rules, reminders, and payment requirements.",
  automation: "Build workflow node plans for triggers, delays, notifications, approvals, and provider actions.",
  analytics: "Summarize metrics, diagnose funnel issues, and propose measured experiments.",
  product: "Structure digital products, lessons, fulfillment, delivery rules, and customer access.",
};

const fallbackByKind: Record<AgentKind, AgentResult> = {
  orchestrator: {
    status: "needs_approval",
    assistantMessage: "I prepared a scoped operator plan with approval-gated actions.",
    proposedToolCalls: ["read_workspace", "draft_records", "request_approval"],
    riskLevel: "medium",
  },
  setup: {
    status: "draft_ready",
    assistantMessage: "Workspace, page, and starter offer drafts are ready for review.",
    proposedToolCalls: ["create_page", "create_offer_draft", "request_approval"],
    riskLevel: "medium",
  },
  bio_builder: {
    status: "draft_ready",
    assistantMessage: "Page copy and block suggestions are ready for review.",
    proposedToolCalls: ["create_page_block", "create_page_version"],
    riskLevel: "low",
  },
  pricing: {
    status: "needs_approval",
    assistantMessage: "Pricing recommendations are ready and require approval before applying.",
    proposedToolCalls: ["analyze_offer", "update_offer_price", "request_approval"],
    riskLevel: "high",
  },
  offer: {
    status: "needs_approval",
    assistantMessage: "Offer drafts are prepared. Publishing and pricing changes need approval.",
    proposedToolCalls: ["create_offer_draft", "draft_checkout", "request_approval"],
    riskLevel: "high",
  },
  growth: {
    status: "needs_approval",
    assistantMessage: "Growth experiments are drafted for approval.",
    proposedToolCalls: ["rewrite_cta", "create_ab_test", "request_approval"],
    riskLevel: "medium",
  },
  booking: {
    status: "draft_ready",
    assistantMessage: "Booking flow draft is ready with provider-safe steps.",
    proposedToolCalls: ["check_availability", "hold_booking", "draft_reminders"],
    riskLevel: "medium",
  },
  automation: {
    status: "draft_ready",
    assistantMessage: "Workflow automation draft is ready with provider-safe steps.",
    proposedToolCalls: ["create_workflow", "run_policy_check", "request_approval"],
    riskLevel: "medium",
  },
  analytics: {
    status: "draft_ready",
    assistantMessage: "Analytics insight draft is ready from available events.",
    proposedToolCalls: ["read_analytics", "create_experiment_suggestion"],
    riskLevel: "low",
  },
  product: {
    status: "draft_ready",
    assistantMessage: "Product structure and fulfillment draft are ready.",
    proposedToolCalls: ["create_product_offer", "create_access_rule", "request_approval"],
    riskLevel: "medium",
  },
};

export async function runModelAgent(input: AgentRunInput): Promise<AgentResult> {
  if (!isProviderConfigured("google")) return fallbackByKind[input.kind];

  try {
    const { object } = await generateObject({
      model: resolveModel("google", "gemini-2.0-flash"),
      schema: agentResultSchema,
      temperature: 0.4,
      system: [
        "You are a KreatorOS production agent.",
        "Return only schema-valid JSON.",
        "Draft safe actions and put risky writes behind approval.",
        "Do not claim external providers, payments, emails, or calendar actions have been executed.",
      ].join(" "),
      prompt: JSON.stringify({
        agent: input.kind,
        brief: agentBriefs[input.kind],
        mode: input.mode ?? "draft",
        userMessage: input.userMessage,
        workspaceContext: input.workspaceContext ?? {},
        expectedPatch: "Use operation objects with action, reason, and draft fields where useful.",
      }),
    });

    return {
      status: object.status,
      assistantMessage: object.assistantMessage,
      proposedToolCalls: object.proposedToolCalls,
      riskLevel: object.riskLevel,
      suggestionTitle: object.suggestionTitle,
      patch: {
        targetType: object.targetType,
        operations: object.operations,
      },
    };
  } catch (error) {
    const fallback = fallbackByKind[input.kind];
    const message = error instanceof Error ? error.message : "Model request failed.";
    return {
      ...fallback,
      status: "failed",
      assistantMessage: `${fallback.assistantMessage} Gemini could not complete this run: ${message}`,
    };
  }
}
