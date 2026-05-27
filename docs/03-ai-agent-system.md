# AI agent system

## Agent model

Each agent has:

- Role: what it is allowed to think about.
- Tools: functions it can call.
- Memory: workspace objects and vector knowledge it can retrieve.
- Policy: what requires approval.
- Output schema: structured JSON, not freeform only.
- Audit: every proposed and executed action is logged.

## Agent types

Agent | Purpose | Tools
--- | --- | ---
Business Setup Agent | Onboarding, page, offers, theme | create_profile, create_page, create_block, generate_theme
Offer Agent | Products, bookings, bundles, pricing | create_product, create_booking_type, create_bundle, suggest_price
Booking Agent | Routing, scheduling, reminders | check_availability, create_event, send_reminder, reschedule_booking
Research Agent | Askiva-like interviews | import_participants, send_invite, create_zoom, transcribe, summarize
Brand Agent | Media kits, pitches, campaigns | create_media_kit, draft_pitch, create_proposal, campaign_report
Support Agent | Customer help | lookup_order, grant_access, draft_reply, escalate_refund
Growth Agent | Analytics and experiments | analyze_funnel, create_ab_test, rewrite_cta, launch_campaign
Compliance Guard | Risk management | policy_check, require_approval, audit_log, revoke_action

## Tool call lifecycle

1. User requests outcome.
2. Agent retrieves relevant workspace graph.
3. Agent creates plan.
4. Policy engine classifies actions by risk.
5. Agent drafts records and previews changes.
6. User approves or edits.
7. Workflow runner executes provider calls.
8. Audit log stores all actions.
9. Analytics tracks outcome.
10. Agent learns from result.

## Example: create paid booking funnel

User: Create a paid booking funnel for serious founders.

Agent plan:

- Create routing form with questions: role, goal, budget, timezone.
- If budget below threshold, show $19 async audit.
- If high intent, show $149 creator audit.
- Require Stripe payment.
- Create calendar event.
- Send email and WhatsApp confirmation.
- Send prep questions 24 hours before call.
- Draft follow-up with product or membership upsell.

## Memory/RAG

The AI should know:

- Creator bio, niche, tone, offers, products, page blocks.
- Customer purchase and booking history.
- Brand deal history.
- Course/membership content.
- Analytics and conversion data.
- Provider connection state.
- Previous approvals and user preferences.

Use Postgres + pgvector for embeddings on transcripts, docs, messages, and support threads.
