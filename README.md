# KreatorOS

KreatorOS is an AI business operator for creators, coaches, educators, consultants, influencers, and brand teams. This v4 package upgrades the earlier prototype into a more production-shaped Next.js SaaS blueprint with:

- Askiva-inspired automation flow design: project/workspace setup, participant/customer lists, outreach, scheduling, sessions, transcripts/notes, insights, exports.
- Calendly/Cal.com-inspired scheduling: routing forms, availability, event types, recurring schedules, payments, reminders, rescheduling, and follow-up workflows.
- Creator, brand, client/member, and public page experiences.
- Custom AI agent system that knows the app data model and can create tasks, pages, offers, workflows, booking rules, product funnels, and brand campaigns.
- Node-style workflow editor built without external graph dependency, so it works as a pure React client component.
- Supabase Auth/Postgres/RLS schema, route contracts, provider matrix, and automation specs.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main routes

- `/` — marketing landing page
- `/login` — role-based auth entry
- `/creator` — creator command center
- `/creator/ai-operator` — app-native AI operator
- `/creator/builder` — bio/store builder with preview
- `/creator/preview` — full public page preview studio
- `/creator/calendar` — Calendly/Cal.com-style booking studio
- `/creator/store` — products, bundles, upsells, fulfillment
- `/creator/agents` — AI agent creation and skills/tools
- `/creator/workflows` — node-based workflow editor
- `/creator/research-lab` — Askiva-inspired customer research automation
- `/creator/brand-crm` — brand deal CRM
- `/creator/analytics` — analytics and AI insights
- `/brand` — brand command center
- `/brand/discover` — creator discovery
- `/brand/campaigns` — campaign builder
- `/brand/collab-room` — collaboration room + chat + deliverables
- `/portal` — client/buyer/member portal
- `/u/aarav` — public creator bio/store page

## Product thesis

The market already has bio links, booking pages, stores, communities, and courses. KreatorOS AI is not another static link tool. It is the operating layer that understands a creator's business graph and runs workflows across offers, bookings, payments, members, customers, brands, content, and analytics.

## Suggested implementation path

1. Build the public page + booking + payment + customer records first.
2. Add AI Operator as a tool-calling layer that creates real records only after approval.
3. Add workflow engine with event triggers and provider adapters.
4. Add brand workspace and research lab after the creator monetization loop works.
5. Add marketplace/discovery only after creator supply and transaction data exist.

## Project structure

- `src/app` - Next.js App Router pages and API route entrypoints, organized with route groups.
- `src/components/layout` - shared shells and navigation chrome.
- `src/components/ui` - reusable UI primitives.
- `src/features/*` - feature-owned UI, config, server helpers, hooks, and types.
- `src/shared/mock` - demo data for prototype screens.
- `src/server/api` - API response helpers and Zod request schemas.
- `src/server/supabase` - server-side Supabase client/session foundation.
- `src/client/supabase` - browser-side Supabase client foundation.
- `supabase` - database schema and RLS policy references.
- `docs` - product architecture, routes, providers, workflows, and strategy.

## Files to read first

- `docs/01-research-and-positioning.md`
- `docs/02-product-architecture.md`
- `docs/03-ai-agent-system.md`
- `docs/04-workflow-engine.md`
- `docs/05-api-routes.md`
- `docs/06-provider-services.md`
- `docs/07-screen-map.md`
- `docs/08-yc-grade-product-strategy.md`
- `docs/09-folder-structure.md`
- `supabase/schema.sql`
- `supabase/rls.sql`
