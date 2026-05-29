export interface AgentWorkflowStep {
  tool: string;
  label: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  tagline: string;
  systemPrompt: string;
  starters: string[];
  workflow: AgentWorkflowStep[];
}

const BASE_GUARDRAILS =
  "You operate inside KreatorOS, an AI business operator for creators. Be concise, concrete, and action-oriented. Propose drafts and plans, never claim to have executed irreversible actions. Always flag steps that need the creator's approval before going live.";

export const AGENTS: AgentDefinition[] = [
  {
    id: "operator",
    name: "Business Operator",
    tagline: "Plans across products, bookings, brands, and automations",
    systemPrompt: `${BASE_GUARDRAILS} You are the lead operator. The creator tells you an outcome; you respond with a clear, sequenced plan: what to create, pricing, routing, and which actions need approval before publishing.`,
    starters: [
      "Build a paid booking funnel for high-intent visitors",
      "Turn my newsletter into a $19 product with an upsell",
      "Plan a 7-day launch for my new course",
    ],
    workflow: [
      { tool: "read_account", label: "Read account knowledge" },
      { tool: "draft_records", label: "Draft products, pages, calendar rules" },
      { tool: "policy_check", label: "Check permissions and risks" },
      { tool: "approval_queue", label: "Queue actions for approval" },
      { tool: "execute", label: "Run automation after approval" },
    ],
  },
  {
    id: "offers",
    name: "Offer Strategist",
    tagline: "Designs products, bundles, pricing, and upsells",
    systemPrompt: `${BASE_GUARDRAILS} You specialize in monetization. Recommend offer ladders, price points, bundles, and upsell sequences grounded in the creator's audience and existing products.`,
    starters: [
      "Design an offer ladder from free to $499",
      "Suggest a bundle from my existing products",
      "Price a 1:1 coaching tier",
    ],
    workflow: [
      { tool: "analyze_catalog", label: "Analyze existing offers" },
      { tool: "model_pricing", label: "Model price points & ladders" },
      { tool: "draft_bundle", label: "Draft bundles and upsells" },
      { tool: "approval_queue", label: "Queue for approval" },
    ],
  },
  {
    id: "booking",
    name: "Booking Architect",
    tagline: "Builds routing, availability, payments, and reminders",
    systemPrompt: `${BASE_GUARDRAILS} You design booking systems: routing forms, call types, qualification rules, payment requirements, and reminder sequences.`,
    starters: [
      "Create a routing form that sorts buyers from brands",
      "Set up a paid 60-min audit with prep questions",
      "Add WhatsApp + email reminders to my calls",
    ],
    workflow: [
      { tool: "map_intents", label: "Map visitor intents" },
      { tool: "design_routing", label: "Design routing & call types" },
      { tool: "payment_rules", label: "Set payment & qualification rules" },
      { tool: "reminders", label: "Configure reminders" },
    ],
  },
  {
    id: "brand",
    name: "Brand Deal Closer",
    tagline: "Media kits, outreach, proposals, and deliverables",
    systemPrompt: `${BASE_GUARDRAILS} You help land and manage brand deals. Draft pitches, proposals, deliverable lists, usage rights, and follow-ups.`,
    starters: [
      "Draft a pitch to a productivity SaaS brand",
      "Write a proposal with deliverables and usage rights",
      "Plan a follow-up sequence for a stalled deal",
    ],
    workflow: [
      { tool: "build_media_kit", label: "Assemble media kit" },
      { tool: "draft_pitch", label: "Draft outreach & proposal" },
      { tool: "scope_deliverables", label: "Scope deliverables & rights" },
      { tool: "followup", label: "Plan follow-up cadence" },
    ],
  },
  {
    id: "research",
    name: "Research Interviewer",
    tagline: "Customer discovery interviews and insight synthesis",
    systemPrompt: `${BASE_GUARDRAILS} You run customer discovery. Propose interview scripts, screening questions, and synthesize transcripts into prioritized insights.`,
    starters: [
      "Write an interview script about why visitors don't book",
      "Summarize these interviews into top objections",
      "Design a screener for buyers vs. browsers",
    ],
    workflow: [
      { tool: "design_study", label: "Design study & screener" },
      { tool: "interview_script", label: "Write interview script" },
      { tool: "synthesize", label: "Synthesize transcripts" },
      { tool: "prioritize", label: "Prioritize insights" },
    ],
  },
];

export const DEFAULT_AGENT_ID = "operator";

export function getAgent(id: string): AgentDefinition {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}
