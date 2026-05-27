# Product architecture

## Roles

1. Creator: builds public page, products, bookings, memberships, courses, workflows, brand CRM, analytics.
2. Brand: discovers creators, creates campaigns, chats in collab room, approves deliverables, pays, downloads reports.
3. Client/customer/member/student: buys, books, accesses content, manages membership, asks support.
4. Admin: monitors providers, policies, abuse, refunds, disputes, platform revenue.

## Core domain objects

- Workspace
- User membership
- Creator profile
- Public page
- Page block
- Offer
- Product
- Booking type
- Availability rule
- Booking
- Customer
- Order
- Subscription
- Course
- Lesson
- Membership tier
- Brand profile
- Brand campaign
- Collaboration room
- Message thread
- Deliverable
- Contract
- Payout
- Workflow
- Workflow node
- Workflow run
- AI agent
- Agent tool
- Approval request
- Research project
- Participant
- Interview session
- Transcript
- Insight theme
- Analytics event

## System layers

Layer | Responsibility
--- | ---
Next.js App Router | Role-based UI, public pages, API routes
Supabase Auth | Auth, JWT, session, provider login
Supabase Postgres | Source of truth business graph
RLS | Tenant/workspace isolation
Supabase Storage/R2/S3 | Files, digital products, transcripts, brand assets
Workflow runner | Scheduled and event-driven automations
AI orchestration service | Tool planning, policy checks, structured outputs
Provider adapters | Stripe, Cal.com, Google Calendar, WhatsApp, Zoom, email
Analytics pipeline | Events, funnels, attribution, AI summaries
Audit log | Every AI action and provider mutation

## Critical safety design

The AI agent should draft by default and execute only after policy allows it.

Risk level | Examples | Required control
--- | --- | ---
Low | Rewrite CTA, reorder draft blocks | Auto-draft, creator can publish
Medium | Send email reminder, create calendar event | Template + opt-in + approval setting
High | Refund, publish public offer, send WhatsApp campaign, charge payment | Explicit approval + audit log
Critical | Delete customer data, change payout account | Manual admin or multi-step verification
