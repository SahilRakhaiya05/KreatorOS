# CreatorOS AI Remaining Phases Handoff Prompt

Use this prompt in another IDE or Codex session to continue after Phases 0-4.

```text
You are working in the existing CreatorOS AI Next.js/Supabase SaaS repo:
C:\Users\Admin\Downloads\creatoros_ai_v4_askiva_nextjs_saas

Read AGENTS.md and KreatorOS_AI_Context.md first. Do not rebuild from scratch. Preserve all current routes, UI direction, Supabase migrations, RLS, and workspace/auth boundaries already implemented.

Current completed scope:
- Phase 0: route/codebase stabilization, provider status shell, placeholder route cleanup, mock isolation.
- Phase 1: workspace/auth foundation, workspace_members, active workspace selection, server route guards, unauthorized handling, dashboard access blocked without auth/workspace permissions.
- Phase 2: RLS/security/audit/provider foundation, app_private helpers, service-role-only server modules, audit_logs/security_events/provider_connections.
- Phase 3: page builder persistence, safe Page DSL, page_versions, public page safety, public AI assistant configuration, assistant knowledge/chat/lead tables, public assistant widget, assistant metrics from real DB events.
- Phase 4: real offers/store foundation, products/memberships/courses/gated_content, coupons, bundles, checkout_intents, order_items, checkout intent/order/access-grant path, public offer-backed blocks, no fake Stripe URL in production.

Important constraints:
- Never expose SUPABASE_SERVICE_ROLE_KEY to client code.
- Keep every workspace-owned table protected by RLS.
- Use apiOk/apiError and Zod schemas in src/server/api/schemas.ts.
- Use service role only in server routes/helpers for public webhooks, checkout, provider callbacks, automations, audit/event writes, and access checks.
- Public pages may read only published page data, live blocks, active assistants, and published offers.
- Authenticated dashboards must only show active workspace data for the signed-in user.
- Do not silently fake production providers. If a provider is not connected, return a clear provider_not_configured response and show the required connection action.
- Every important mutation should write audit_logs and/or analytics/workflow events.

Continue in this order:

Phase 5 - Booking and Calendar
- Add booking lifecycle tables: bookings, booking_holds, booking_events, booking_reminders.
- Link bookings to workspace_id, page_id, offer_id, customer_id, order_id, calendar slot/provider event ids.
- Implement no-double-booking constraints and slot hold expiration.
- Complete /api/bookings, /api/calendar/events, /api/calendar/connect, and provider calendar event creation.
- Paid booking flow should create/update customer, order, booking, calendar event, notification event, analytics event, and audit log.

Phase 6 - Payments
- Implement Stripe Connect onboarding, account status, Checkout Sessions, subscriptions, webhooks, payment status sync, refund approval.
- Never store card data. Webhooks must verify signatures and be idempotent.
- Payment success should update orders, checkout_intents, access_grants, bookings/memberships/courses, analytics_events, workflow_events, and audit_logs.

Phase 7 - Notifications
- Add notification_templates, notification_messages, notification_preferences, unsubscribes/opt-ins.
- Implement email provider adapter and WhatsApp provider adapter behind server routes.
- Booking/product/membership/course events should enqueue/send notifications only when provider is connected or sandbox.

Phase 8 - Workflow Engine
- Expand workflow_events/workflow_runs into a usable automation engine.
- Add workflow_steps if needed, visual workflow builder UI, templates, retries, approval nodes, AI nodes, provider action nodes, run logs.
- Routes should emit events; automation runner handles side effects.

Phase 9 - AI Agent System
- Complete agent registry, prompt registry, tool registry, agent memory, ai_jobs, ai_tool_calls, ai_prompt_versions.
- Add orchestrator and specialized agents that return structured outputs.
- High-risk tool calls require approval and all AI actions are logged.

Phase 10 - Brand Ecosystem
- Add real brand profiles, campaigns, campaign briefs, creator discovery, invitations, collaboration rooms, deliverables, campaign links, campaign analytics, media kits/rate cards.
- Keep creator/brand workspace permission boundaries strict.

Phase 11 - Marketplace and Apps
- Add app marketplace tables: apps, app_versions, app_scopes, app_installs, app_actions, app_triggers, app_webhooks.
- App installs must grant scoped capabilities only; workflow builder and AI tools can use installed app actions only when allowed.

Phase 12 - Analytics and AI Growth
- Build real analytics summaries, rollups, date filters, charts, funnels, attribution, revenue/MRR/customer growth, AI insights, weekly reports, experiments.
- No fake dashboard numbers. Use analytics_events, orders, bookings, customers, access_grants, and campaign data.

Phase 13 - Portal
- Add secure customer portal access, product delivery, booking list, membership/course access, receipts, and magic-link flow.
- Customers should only see their own purchases/access.

Phase 14 - Enterprise Readiness
- Add custom roles, audit export, API keys, custom domains, rate limits, data export/deletion flows, billing plans, usage tracking, SSO later.

After each phase:
- Update Supabase migrations locally and apply them to project baezoomwwsicqfwngvvz if Supabase access is available.
- Update UI and API routes together; do not leave DB-only features invisible.
- Avoid broad refactors unrelated to the phase.
- If tests/build are allowed in the new session, run npm run typecheck and npm run build before claiming completion.
```
