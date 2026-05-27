# Folder Structure

KreatorOS uses a hybrid Next.js structure: routes stay in `src/app`, while reusable product logic lives in feature and server folders.

## Top Level

- `src/app` - Next.js App Router routes and route handlers.
- `src/components` - app-wide layout and generic UI primitives.
- `src/features` - domain modules such as auth, onboarding, booking, research, workflow, and AI operator.
- `src/shared` - shared mock data and cross-feature constants.
- `src/server` - server-only API, Supabase, and provider foundations.
- `src/client` - browser-only client factories and adapters.
- `supabase` - database schema and RLS source files.
- `docs` - product and engineering reference docs.
- `rules`, `hooks`, `contexts`, `config` - KreatorOS generated rules and workflow metadata.

## App Router

Route groups organize pages without changing URLs:

- `src/app/(marketing)` - public landing surfaces.
- `src/app/(auth)` - login, auth callback, and auth error routes.
- `src/app/(creator)` - creator workspace routes.
- `src/app/(brand)` - brand workspace routes.
- `src/app/(portal)` - client/member portal routes.
- `src/app/(public)` - public creator pages such as `/u/[slug]`.
- `src/app/api` - HTTP route handlers.

## Feature Modules

Each feature can grow with this shape:

```text
src/features/<feature>/
  components/
  config/
  hooks/
  server/
  types.ts
```

Start with only the folders a feature needs. Keep UI in `components`, feature constants in `config`, server actions/adapters in `server`, and shared feature types in `types.ts`.

## API Modules

API route files in `src/app/api/**/route.ts` should stay thin:

1. Parse and validate request data.
2. Call a server module or provider adapter.
3. Return a shared response shape.

Shared API helpers live in `src/server/api`:

- `schemas.ts` - Zod request contracts.
- `responses.ts` - `apiOk`, `apiError`, and JSON parsing helpers.

## Supabase

Supabase code is split by runtime:

- `src/server/supabase` - SSR/server clients, session helpers, and security-sensitive code.
- `src/client/supabase` - browser client factory for Client Components.
- `supabase/schema.sql` and `supabase/rls.sql` - database source references.

Use `getClaims()` for server-side auth checks. Never expose service-role keys in browser code.
