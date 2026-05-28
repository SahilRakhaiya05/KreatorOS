create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  fulfillment_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  name text not null,
  billing_interval text not null default 'month' check (billing_interval in ('week','month','year','one_time')),
  benefits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gated_content (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  title text not null,
  content_type text not null default 'file' check (content_type in ('file','post','video','link','course_lesson')),
  content_ref text,
  access_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_workspace_idx on public.products(workspace_id);
create index if not exists membership_plans_workspace_idx on public.membership_plans(workspace_id);
create index if not exists courses_workspace_idx on public.courses(workspace_id);
create index if not exists course_lessons_course_idx on public.course_lessons(course_id, sort_order);
create index if not exists gated_content_workspace_idx on public.gated_content(workspace_id);

alter table public.products enable row level security;
alter table public.membership_plans enable row level security;
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.gated_content enable row level security;

create policy "workspace editors manage products" on public.products
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "workspace editors manage membership plans" on public.membership_plans
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "workspace editors manage courses" on public.courses
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "workspace editors manage course lessons" on public.course_lessons
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "workspace editors manage gated content" on public.gated_content
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

grant select, insert, update, delete on public.products, public.membership_plans, public.courses, public.course_lessons, public.gated_content to authenticated;
