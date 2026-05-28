create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  page_id uuid references public.creator_pages(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  actor_type text not null check (actor_type in ('visitor', 'customer', 'creator', 'brand', 'system', 'agent', 'provider')),
  actor_id text,
  action text not null,
  target_type text not null,
  target_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  status text not null default 'not_configured' check (status in ('not_configured', 'sandbox', 'mock_mode', 'connected', 'needs_reauth', 'error', 'disabled')),
  capabilities text[] not null default '{}'::text[],
  credentials_ref text,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create table if not exists public.page_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  version_number int not null,
  dsl jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_type text not null check (created_by_type in ('creator', 'agent', 'system')),
  change_summary text,
  created_at timestamptz not null default now(),
  unique (page_id, version_number)
);

create table if not exists public.page_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  dsl jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.page_themes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  asset_type text not null,
  url text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('product', 'booking', 'membership', 'course', 'service', 'brand_package', 'lead_magnet', 'event', 'bundle', 'affiliate', 'donation')),
  title text not null,
  slug text not null,
  description text,
  price_cents int not null default 0,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'archived')),
  config jsonb not null default '{}'::jsonb,
  ai_generated_copy jsonb not null default '{}'::jsonb,
  cover_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (page_id, slug)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  name text,
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  amount_cents int not null default 0,
  currency text not null default 'usd',
  provider text,
  provider_checkout_id text,
  provider_payment_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  grant_type text not null default 'offer',
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  type text not null,
  actor_type text not null check (actor_type in ('visitor', 'customer', 'creator', 'brand', 'system', 'agent', 'provider')),
  actor_id text,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid references public.workflow_events(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  logs jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  event_type text not null,
  visitor_id text,
  session_id text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete set null,
  agent_id text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'needs_approval', 'succeeded', 'failed', 'cancelled')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  job_id uuid references public.ai_jobs(id) on delete set null,
  title text not null,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied', 'cancelled')),
  patch jsonb not null default '{}'::jsonb,
  explanation text,
  created_by_type text not null default 'agent' check (created_by_type in ('creator', 'agent', 'system')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_workspace_created_idx on public.audit_logs(workspace_id, created_at desc);
create index if not exists provider_connections_workspace_idx on public.provider_connections(workspace_id);
create index if not exists page_versions_page_version_idx on public.page_versions(page_id, version_number desc);
create index if not exists offers_workspace_status_idx on public.offers(workspace_id, status);
create index if not exists workflow_events_workspace_type_idx on public.workflow_events(workspace_id, type, created_at desc);
create index if not exists analytics_events_workspace_created_idx on public.analytics_events(workspace_id, created_at desc);
create index if not exists ai_suggestions_workspace_status_idx on public.ai_suggestions(workspace_id, status);

alter table public.audit_logs enable row level security;
alter table public.security_events enable row level security;
alter table public.provider_connections enable row level security;
alter table public.page_versions enable row level security;
alter table public.page_templates enable row level security;
alter table public.page_themes enable row level security;
alter table public.page_assets enable row level security;
alter table public.offers enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.access_grants enable row level security;
alter table public.workflow_events enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.automation_rules enable row level security;
alter table public.analytics_events enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.ai_suggestions enable row level security;

create policy "workspace members read audit logs" on public.audit_logs for select to authenticated using (workspace_id is not null and app_private.is_workspace_member(workspace_id));
create policy "workspace members insert audit logs" on public.audit_logs for insert to authenticated with check (workspace_id is not null and app_private.is_workspace_member(workspace_id));
create policy "workspace admins read security events" on public.security_events for select to authenticated using (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin']));
create policy "workspace admins manage provider connections" on public.provider_connections for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin']));
create policy "workspace editors read page versions" on public.page_versions for select to authenticated using (workspace_id is not null and app_private.is_workspace_member(workspace_id));
create policy "workspace editors insert page versions" on public.page_versions for insert to authenticated with check (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads published page templates" on public.page_templates for select to anon, authenticated using (status = 'published');
create policy "workspace editors manage page themes" on public.page_themes for all to authenticated using (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "workspace editors manage page assets" on public.page_assets for all to authenticated using (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "workspace members read offers" on public.offers for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "workspace editors manage offers" on public.offers for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads published offers" on public.offers for select to anon using (status = 'published');
create policy "workspace members manage customers" on public.customers for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "workspace members read orders" on public.orders for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "workspace members read access grants" on public.access_grants for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "workspace members read workflow events" on public.workflow_events for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "workspace members insert workflow events" on public.workflow_events for insert to authenticated with check (app_private.is_workspace_member(workspace_id));
create policy "workspace members read workflow runs" on public.workflow_runs for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "workspace members insert workflow runs" on public.workflow_runs for insert to authenticated with check (app_private.is_workspace_member(workspace_id));
create policy "workspace editors manage automation rules" on public.automation_rules for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "workspace members read analytics events" on public.analytics_events for select to authenticated using (workspace_id is not null and app_private.is_workspace_member(workspace_id));
create policy "workspace members insert analytics events" on public.analytics_events for insert to authenticated with check (workspace_id is null or app_private.is_workspace_member(workspace_id));
create policy "workspace members read ai jobs" on public.ai_jobs for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "workspace members insert ai jobs" on public.ai_jobs for insert to authenticated with check (app_private.is_workspace_member(workspace_id));
create policy "workspace members read ai suggestions" on public.ai_suggestions for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "workspace admins manage ai suggestions" on public.ai_suggestions for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

grant select on public.page_templates to anon;
grant select on public.offers to anon;
grant select, insert on public.analytics_events to anon;
grant select on public.audit_logs, public.security_events, public.provider_connections, public.page_versions, public.page_themes, public.page_assets, public.offers, public.customers, public.orders, public.access_grants, public.workflow_events, public.workflow_runs, public.automation_rules, public.analytics_events, public.ai_jobs, public.ai_suggestions to authenticated;
grant insert on public.audit_logs, public.page_versions, public.workflow_events, public.workflow_runs, public.analytics_events, public.ai_jobs to authenticated;
grant insert, update, delete on public.provider_connections, public.page_themes, public.page_assets, public.offers, public.customers, public.automation_rules, public.ai_suggestions to authenticated;
