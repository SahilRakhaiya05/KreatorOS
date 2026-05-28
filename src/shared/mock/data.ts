import {
  Bot, Calendar, CreditCard, FileText, Gift, Globe2, Handshake, Inbox, LayoutDashboard,
  Link as LinkIcon, LockKeyhole, MessageCircle, PlayCircle, Rocket, Settings, ShoppingBag,
  Sparkles, Store, Users, Wand2, Zap, BarChart3, Brain, Route, ClipboardList, PhoneCall,
  Mic, Languages, ShieldCheck, Puzzle, Workflow
} from "lucide-react";

export const creator = {
  name: "Demo Creator",
  handle: "@demo",
  slug: "demo",
  page: "/u/demo",
  niche: "AI productivity mentor",
  audience: "founders, students, solo creators",
  promise: "I help creators turn attention into paid products, calls, memberships, and brand deals with AI systems.",
  revenue: "$18,420",
  mrr: "$3,280",
};

export const demoWorkspaces = {
  creator: [
    { name: "Demo Studio", type: "Creator", plan: "Pro", href: "/creator" },
    { name: "Launch Collective", type: "Agency", plan: "Demo", href: "/creator" },
  ],
  brand: [
    { name: "Brand HQ", type: "Brand", plan: "Business", href: "/brand" },
    { name: "Launch Collective", type: "Agency", plan: "Demo", href: "/brand" },
  ],
  portal: [{ name: "Demo Portal", type: "Client", plan: "Member", href: "/portal" }],
};

export const providerStatuses = [
  { name: "Stripe", status: "not_configured", label: "Not connected", requiredFor: "Payments and subscriptions" },
  { name: "Google Calendar", status: "not_configured", label: "Not connected", requiredFor: "Calendar events" },
  { name: "Cal.com", status: "sandbox", label: "Sandbox available", requiredFor: "Booking webhooks" },
  { name: "WhatsApp Business", status: "not_configured", label: "Not connected", requiredFor: "WhatsApp reminders" },
  { name: "Email", status: "mock_mode", label: "Local mock mode", requiredFor: "Transactional email" },
];

export const approvalQueue = [
  { title: "Publish new membership offer", risk: "High", status: "Pending", target: "Offer" },
  { title: "Rewrite hero headline", risk: "Low", status: "Auto-applicable", target: "Page" },
  { title: "Send booking follow-up campaign", risk: "High", status: "Pending", target: "Messaging" },
];

export const workflowEvents = [
  { type: "page.viewed", source: "Public page", status: "Stored" },
  { type: "offer.created", source: "Store", status: "Automation queued" },
  { type: "ai.suggestion.created", source: "AI Operator", status: "Approval queue" },
  { type: "checkout.started", source: "Payments", status: "Provider gated" },
];

export const assistantMetrics = [
  { label: "Assistant chats", value: "128", detail: "Public visitors routed this month" },
  { label: "Offer recommendations", value: "312", detail: "Products, calls, and memberships suggested" },
  { label: "Leads captured", value: "46", detail: "Saved to leads table" },
  { label: "Approval-safe actions", value: "100%", detail: "No private data exposed" },
];

export type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
export type NavGroup = { group: string; items: NavItem[] };

export const nav: Record<"creator" | "brand" | "portal", NavGroup[]> = {
  creator: [
    {
      group: "Workspace",
      items: [
        { href: "/creator", label: "Command", icon: LayoutDashboard },
        { href: "/creator/chat", label: "AI Operator", icon: Bot },
      ],
    },
    {
      group: "Build",
      items: [
        { href: "/creator/link", label: "Smart Link", icon: Rocket },
      ],
    },
    {
      group: "Smart Link",
      items: [
        { href: "/creator/link/profile", label: "Profile & Links", icon: LinkIcon },
        { href: "/creator/link/builder", label: "Bio Builder", icon: Puzzle },
        { href: "/creator/link/products", label: "Products", icon: Store },
        { href: "/creator/link/wallet", label: "Wallet", icon: CreditCard },
        { href: "/creator/link/affiliate", label: "Affiliate Links", icon: Gift },
        { href: "/creator/link/referrals", label: "Refer & Earn", icon: Users },
        { href: "/creator/link/assistant", label: "AI Assistant", icon: Bot },
        { href: "/creator/link/analytics", label: "Link Analytics", icon: BarChart3 },
        { href: "/creator/link/settings", label: "Link Settings", icon: Settings },
      ],
    },
    {
      group: "Automate",
      items: [
        { href: "/creator/agents", label: "Agents", icon: Sparkles },
        { href: "/creator/workflows", label: "Workflows", icon: Workflow },
        { href: "/creator/calendar", label: "Calendar", icon: Calendar },
      ],
    },
    {
      group: "Grow",
      items: [
        { href: "/creator/brand-crm", label: "Brand CRM", icon: Handshake },
        { href: "/creator/research-lab", label: "Research Lab", icon: Mic },
        { href: "/creator/analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
  ],
  brand: [
    {
      group: "Workspace",
      items: [
        { href: "/brand", label: "Brand HQ", icon: LayoutDashboard },
        { href: "/brand/discover", label: "Discover", icon: Users },
      ],
    },
    {
      group: "Campaigns",
      items: [
        { href: "/brand/campaigns", label: "Campaigns", icon: ClipboardList },
        { href: "/brand/collab-room", label: "Collab Room", icon: MessageCircle },
      ],
    },
  ],
  portal: [
    {
      group: "Workspace",
      items: [{ href: "/portal", label: "My Portal", icon: LayoutDashboard }],
    },
    {
      group: "Access",
      items: [
        { href: "/portal/bookings", label: "Bookings", icon: Calendar },
        { href: "/portal/products", label: "Products", icon: ShoppingBag },
        { href: "/portal/membership", label: "Membership", icon: LockKeyhole },
      ],
    },
  ],
};

export const stats = [
  { label: "Revenue", value: "$18.4k", change: "+31%", icon: CreditCard },
  { label: "Bookings", value: "148", change: "+22%", icon: Calendar },
  { label: "Customers", value: "1,280", change: "+44%", icon: Users },
  { label: "Brand pipeline", value: "$11.7k", change: "+18%", icon: Handshake },
];

export const products = [
  { name: "Creator AI Templates", type: "Notion + PDF", price: "$29", sales: 312, revenue: "$9,048", status: "Live", automation: "Fulfillment + review ask + bundle upsell" },
  { name: "Prompt Vault Pro", type: "Download", price: "$19", sales: 488, revenue: "$9,272", status: "Live", automation: "Instant access + membership pitch" },
  { name: "AI Creator Launchpad", type: "Course", price: "$149", sales: 47, revenue: "$7,003", status: "Draft", automation: "Course drip + completion nudges" },
  { name: "Business Audit Bundle", type: "Product + Call", price: "$199", sales: 26, revenue: "$5,174", status: "Live", automation: "Checkout + scheduler + prep form" },
];

export const bookings = [
  { title: "AI Strategy Call", route: "General visitors", duration: "30 min", price: "$49", type: "Paid", rules: ["Require payment", "Ask 3 prep questions", "Auto-create Meet", "Send WhatsApp reminder"] },
  { title: "Creator Business Audit", route: "High-intent buyers", duration: "60 min", price: "$149", type: "Paid", rules: ["Only buyers with product purchase", "Create prep doc", "Draft follow-up offer"] },
  { title: "Brand Discovery Call", route: "Brand companies", duration: "20 min", price: "Free", type: "Qualified", rules: ["Require brand budget", "Route to brand calendar", "Create campaign draft"] },
  { title: "Member Office Hours", route: "Members only", duration: "45 min", price: "Included", type: "Gated", rules: ["Verify membership", "Group session", "Send replay link"] },
];

export const agents = [
  { name: "Business Setup Agent", icon: Wand2, status: "Active", scope: "Creates workspace, page, brand tone, default offers", tools: ["create_profile", "create_page", "write_copy", "create_theme"] },
  { name: "Offer & Pricing Agent", icon: Gift, status: "Active", scope: "Suggests products, calls, bundles, course, membership tiers", tools: ["create_product", "create_booking", "create_bundle", "pricing_test"] },
  { name: "Booking Agent", icon: Calendar, status: "Active", scope: "Routing forms, availability, payments, reminders, reschedules", tools: ["check_availability", "create_event", "send_reminder", "reschedule"] },
  { name: "Research Interview Agent", icon: Mic, status: "Beta", scope: "Askiva-like customer discovery interviews and summaries", tools: ["import_participants", "send_invite", "join_zoom", "summarize_transcript"] },
  { name: "Brand Deal Agent", icon: Handshake, status: "Active", scope: "Media kit, outreach, proposals, deliverables, reports", tools: ["create_media_kit", "draft_pitch", "generate_contract", "campaign_report"] },
  { name: "Support Agent", icon: Inbox, status: "Draft", scope: "Answers access questions and drafts support replies", tools: ["lookup_order", "grant_access", "draft_reply", "escalate_refund"] },
  { name: "Growth Agent", icon: Rocket, status: "Active", scope: "Conversion insights, A/B tests, retargeting workflows", tools: ["analyze_funnel", "create_ab_test", "rewrite_cta", "launch_campaign"] },
  { name: "Compliance Guard", icon: ShieldCheck, status: "Always on", scope: "Approvals, permission checks, audit logs, provider policy", tools: ["policy_check", "approval_request", "audit_log", "revoke_action"] },
];

export const workflowNodes = [
  { id: "trigger", type: "Trigger", title: "Visitor submits routing form", meta: "Budget + goal + timezone", tone: "bg-lavender" },
  { id: "qualify", type: "AI Decision", title: "Score intent + route", meta: "Buyer / brand / member", tone: "bg-mint" },
  { id: "booking", type: "Action", title: "Show matching calendar", meta: "Paid, free, team, or gated", tone: "bg-aqua" },
  { id: "payment", type: "Action", title: "Collect payment if required", meta: "Stripe Connect / Razorpay", tone: "bg-lemon" },
  { id: "notify", type: "Action", title: "Send confirmation", meta: "Email + WhatsApp + calendar invite", tone: "bg-coral" },
  { id: "followup", type: "AI Action", title: "Draft follow-up + upsell", meta: "Human approval before send", tone: "bg-white" },
];

export const providerServices = [
  { category: "Auth", providers: "Supabase Auth, Clerk, Auth.js", use: "Role-based login for creator, brand, client, admin" },
  { category: "Database", providers: "Supabase Postgres, Neon", use: "Business graph, workflows, events, audit logs" },
  { category: "Payments", providers: "Stripe Connect, Razorpay, Paddle, Lemon Squeezy, Dodo Payments", use: "Creator payouts, brand escrow, subscriptions, digital product checkout" },
  { category: "Calendar", providers: "Google Calendar, Microsoft Outlook, Cal.com API, Calendly API", use: "Availability, routing, recurring sessions, reminders" },
  { category: "Meetings", providers: "Zoom, Google Meet, Whereby, Daily", use: "Calls, interviews, brand meetings, office hours" },
  { category: "Messaging", providers: "WhatsApp Cloud API, Twilio, Resend, SendGrid, Slack, Discord", use: "Confirmations, reminders, support, community alerts" },
  { category: "AI", providers: "OpenAI, Anthropic, Gemini, Groq, local models", use: "Agent planning, copy, analysis, support, tool calling" },
  { category: "Storage", providers: "Supabase Storage, S3, Cloudflare R2", use: "Digital products, course assets, contracts, media kits" },
  { category: "Analytics", providers: "PostHog, Tinybird, ClickHouse, Segment", use: "Page views, clicks, conversion funnels, experiments" },
  { category: "Automation", providers: "Inngest, Trigger.dev, QStash, Temporal", use: "Reliable background jobs and delayed reminders" },
  { category: "Search/RAG", providers: "pgvector, Pinecone, Weaviate", use: "AI knowledge over app data, creator docs, transcripts" },
];

export const researchStudies = [
  { name: "Why visitors do not book calls", status: "Running", participants: 42, completed: 18, language: "EN + Hindi", insight: "People want a lower-priced intro offer before $149 audit." },
  { name: "Product bundle demand", status: "Draft", participants: 120, completed: 0, language: "EN", insight: "AI will interview buyers after template purchase." },
  { name: "Brand buyer objections", status: "Completed", participants: 12, completed: 12, language: "EN", insight: "Brands need clearer deliverables and usage rights before paying." },
];

export const brandDeals = [
  { brand: "NotionFlow", creator: "Demo Creator", stage: "Proposal sent", value: "$1,200", due: "Jun 4", risk: "Waiting on usage rights approval" },
  { brand: "ClipSpark AI", creator: "Demo Creator", stage: "Negotiating", value: "$2,500", due: "Jun 10", risk: "Need revised deliverables" },
  { brand: "StudyPal", creator: "Demo Creator", stage: "Pitched", value: "$800", due: "Jun 14", risk: "Follow-up due tomorrow" },
];

export const pageBlocks = [
  { name: "Hero + creator promise", type: "Header", status: "Live", clicks: 0 },
  { name: "Ask my AI guide", type: "AI concierge", status: "Live", clicks: 884 },
  { name: "Free toolkit", type: "Lead magnet", status: "Live", clicks: 1204 },
  { name: "AI Strategy Call", type: "Paid booking", status: "Live", clicks: 742 },
  { name: "Creator AI Templates", type: "Product", status: "Live", clicks: 1031 },
  { name: "AI Creator Club", type: "Membership", status: "Live", clicks: 399 },
  { name: "Brand collaboration", type: "Brand intake", status: "Live", clicks: 118 },
];
