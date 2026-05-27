# Supabase Server Layer

This folder contains server-safe Supabase setup for Next.js.

- `config.ts` reads public Supabase runtime config.
- `serverClient.ts` creates a per-request SSR client with cookies.
- `session.ts` validates auth with `getClaims()` instead of trusting raw sessions.

Do not put service-role keys in client code or `NEXT_PUBLIC_*` variables.
