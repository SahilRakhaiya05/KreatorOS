# KreatorOS Agent Guide

## Project Shape

- `src/app` contains Next.js App Router pages and API route entrypoints only, grouped by route surface.
- `src/components/ui` contains generic UI primitives with no product data fetching.
- `src/components/layout` contains app-wide layout shells and navigation chrome.
- `src/features/*/components` contains feature-specific React components.
- `src/features/*/config` contains feature constants and route maps.
- `src/shared/mock` contains demo data used by pages and prototype flows.
- `src/server/api` contains shared API schemas, parsing helpers, and response helpers.
- `src/server/supabase` contains server-only Supabase client/session helpers.
- `src/client/supabase` contains browser-only Supabase client helpers.
- `supabase` contains database schema and RLS references.
- `docs` contains product, route, provider, and architecture notes.

## Build Commands

- Install dependencies with `npm install`.
- Run local development with `npm run dev`.
- Build production with `npm run build`.
- Run the production build with `npm run start`.
- Run type checks with `npm run typecheck`.

## Engineering Rules

- Keep route URLs stable unless the requested change explicitly requires a route move.
- Prefer adding shared request schemas in `src/server/api/schemas.ts` before creating new API routes.
- Return API responses with `apiOk` or `apiError` from `src/server/api/responses.ts`.
- Keep provider integrations behind API routes or server modules; do not call paid/external providers directly from UI components.
- Keep reusable UI in `src/components/ui`; move domain-specific UI into `src/features/<feature>/components`.
- Use `@/*` imports instead of long relative paths.
- Prefer relative imports inside the same feature module to follow KreatorOS guardrails.
- Preserve the current demo data flow until real persistence is added.

## Product Direction

KreatorOS is an AI business operator for creators, brands, and client/member portals. New features should fit one of these surfaces:

- Creator monetization: public page, store, booking, calendar, workflows, AI operator, analytics, brand CRM.
- Brand workspace: creator discovery, campaigns, collaboration room, settings.
- Client portal: bookings, products, membership access.
- Server foundation: validated API routes, Supabase-ready persistence, provider adapters, audit-safe AI actions.
