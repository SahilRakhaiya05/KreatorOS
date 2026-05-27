# Provider services matrix

Category | Primary | Alternative | Use
--- | --- | --- | ---
Auth | Supabase Auth | Clerk, Auth.js | Creator/brand/client login
Database | Supabase Postgres | Neon, PlanetScale | SaaS data model
Storage | Supabase Storage | S3, Cloudflare R2 | Files, course assets, transcripts
Payments | Stripe Connect | Razorpay, Paddle, Lemon Squeezy, Dodo Payments | Creator payouts, subscriptions, brand payments
Calendar | Google Calendar | Microsoft Graph, Cal.com, Calendly | Availability and events
Scheduling | Native + Cal.com | Calendly API | Routing forms, paid bookings, group sessions
Video | Zoom | Google Meet, Daily, Whereby | Calls and AI interviews
Messaging | Resend | SendGrid, Postmark | Transactional email
WhatsApp/SMS | WhatsApp Cloud API | Twilio | Reminders and confirmations
AI models | OpenAI | Anthropic, Gemini, Groq, local LLMs | Agents, tool calling, copy, analysis
Vector | pgvector | Pinecone, Weaviate | Workspace memory and transcript search
Automation | Inngest | Trigger.dev, Temporal, QStash | Background workflows and retries
Analytics | PostHog | Segment, Tinybird, ClickHouse | Funnels, attribution, product analytics
Customer support | Native | Intercom, Crisp | Client support and knowledge base
CRM | Native | HubSpot, Salesforce | Brand and customer workflows
Contracts | Native | DocuSign, Dropbox Sign | Brand agreements

## Integration strategy

Start with native core objects and provider adapters. Do not let one provider own the product experience. For example, Cal.com or Calendly can provide scheduling primitives, but KreatorOS should own the creator routing, checkout, customer graph, AI follow-up, and analytics.
