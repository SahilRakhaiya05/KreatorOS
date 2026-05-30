create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slug text unique not null,
  destination_url text not null,
  campaign_name text,
  click_count int not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_name text not null,
  contact_name text,
  contact_email text,
  status text not null default 'lead' check (status in ('lead','pitched','replied','negotiating','approved','delivered','paid','lost')),
  proposal_text text,
  pitch_text text,
  rate_cents int not null default 0,
  currency text not null default 'usd',
  deliverables jsonb not null default '[]'::jsonb,
  campaign_short_link_id uuid references public.short_links(id) on delete set null,
  due_date timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_short_links_workspace on public.short_links(workspace_id);
create index if not exists idx_brand_deals_workspace on public.brand_deals(workspace_id);
create index if not exists idx_brand_deals_campaign_short_link on public.brand_deals(campaign_short_link_id);

alter table public.short_links enable row level security;
alter table public.brand_deals enable row level security;

drop policy if exists "workspace members manage brand_deals" on public.brand_deals;
create policy "workspace members manage brand_deals" on public.brand_deals
  for all to authenticated
  using (app_private.is_workspace_member(workspace_id))
  with check (app_private.is_workspace_member(workspace_id));

grant select on public.short_links to anon;
grant select, insert, update, delete on public.short_links, public.brand_deals to authenticated;
