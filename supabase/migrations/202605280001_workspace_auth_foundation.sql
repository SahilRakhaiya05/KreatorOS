create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null check (type in ('creator', 'brand', 'agency', 'startup', 'community', 'admin')),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'business', 'agency', 'enterprise')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'editor', 'analyst', 'member', 'viewer', 'client', 'brand_user')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  permissions jsonb not null default '{}'::jsonb,
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_switch_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_workspace_id uuid references public.workspaces(id),
  to_workspace_id uuid not null references public.workspaces(id),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists active_workspace_id uuid references public.workspaces(id);

alter table public.creator_pages
  add column if not exists workspace_id uuid references public.workspaces(id);

alter table public.creator_page_blocks
  add column if not exists workspace_id uuid references public.workspaces(id),
  add column if not exists ref_type text,
  add column if not exists ref_id uuid;

alter table public.creator_calendar_slots
  add column if not exists workspace_id uuid references public.workspaces(id);

create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);
create index if not exists workspaces_type_status_idx on public.workspaces(type, status);
create index if not exists workspace_members_user_status_idx on public.workspace_members(user_id, status);
create index if not exists workspace_members_workspace_status_idx on public.workspace_members(workspace_id, status);
create index if not exists creator_pages_workspace_id_idx on public.creator_pages(workspace_id);
create index if not exists creator_page_blocks_workspace_id_idx on public.creator_page_blocks(workspace_id);
create index if not exists creator_calendar_slots_workspace_id_idx on public.creator_calendar_slots(workspace_id);

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists workspace_members_set_updated_at on public.workspace_members;
create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

create schema if not exists app_private;

create or replace function app_private.is_workspace_member(check_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members member
    where member.workspace_id = check_workspace_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  );
$$;

create or replace function app_private.has_workspace_role(check_workspace_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members member
    where member.workspace_id = check_workspace_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role = any(allowed_roles)
  );
$$;

create or replace function app_private.is_page_owner(check_page_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.creator_pages page
    where page.id = check_page_id
      and (
        page.owner_id = (select auth.uid())
        or (page.workspace_id is not null and app_private.has_workspace_role(page.workspace_id, array['owner', 'admin', 'manager', 'editor']))
      )
  );
$$;

create or replace function app_private.can_read_public_page(check_page_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.creator_pages page
    where page.id = check_page_id
      and page.is_published = true
  );
$$;

create or replace function app_private.customer_has_access(_customer_id uuid, _offer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select false;
$$;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated, anon;
grant execute on function app_private.is_workspace_member(uuid) to authenticated;
grant execute on function app_private.has_workspace_role(uuid, text[]) to authenticated;
grant execute on function app_private.is_page_owner(uuid) to authenticated;
grant execute on function app_private.can_read_public_page(uuid) to anon, authenticated;
grant execute on function app_private.customer_has_access(uuid, uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.workspace_switch_logs enable row level security;

drop policy if exists "members read active workspaces" on public.workspaces;
drop policy if exists "owners manage workspaces" on public.workspaces;
drop policy if exists "members read workspace members" on public.workspace_members;
drop policy if exists "owners manage workspace members" on public.workspace_members;
drop policy if exists "owners manage workspace invitations" on public.workspace_invitations;
drop policy if exists "users read own switch logs" on public.workspace_switch_logs;
drop policy if exists "users insert own switch logs" on public.workspace_switch_logs;

create policy "members read active workspaces" on public.workspaces
for select
to authenticated
using (status = 'active' and app_private.is_workspace_member(id));

create policy "owners manage workspaces" on public.workspaces
for all
to authenticated
using (app_private.has_workspace_role(id, array['owner', 'admin']))
with check (owner_id = (select auth.uid()) or app_private.has_workspace_role(id, array['owner', 'admin']));

create policy "members read workspace members" on public.workspace_members
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy "owners manage workspace members" on public.workspace_members
for all
to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner', 'admin']))
with check (app_private.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "owners manage workspace invitations" on public.workspace_invitations
for all
to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner', 'admin']))
with check (app_private.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "users read own switch logs" on public.workspace_switch_logs
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "users insert own switch logs" on public.workspace_switch_logs
for insert
to authenticated
with check (user_id = (select auth.uid()) and app_private.is_workspace_member(to_workspace_id));

drop policy if exists "owner manages creator pages" on public.creator_pages;
drop policy if exists "owner manages creator page blocks" on public.creator_page_blocks;
drop policy if exists "owner manages creator calendar slots" on public.creator_calendar_slots;

create policy "workspace members manage creator pages" on public.creator_pages
for all
to authenticated
using (
  owner_id = (select auth.uid())
  or (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner', 'admin', 'manager', 'editor']))
)
with check (
  owner_id = (select auth.uid())
  or (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner', 'admin', 'manager', 'editor']))
);

create policy "workspace members manage creator page blocks" on public.creator_page_blocks
for all
to authenticated
using (
  app_private.is_page_owner(page_id)
  or (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner', 'admin', 'manager', 'editor']))
)
with check (
  app_private.is_page_owner(page_id)
  or (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner', 'admin', 'manager', 'editor']))
);

create policy "workspace members manage creator calendar slots" on public.creator_calendar_slots
for all
to authenticated
using (
  app_private.is_page_owner(page_id)
  or (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner', 'admin', 'manager', 'editor']))
)
with check (
  app_private.is_page_owner(page_id)
  or (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner', 'admin', 'manager', 'editor']))
);

grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.workspace_invitations to authenticated;
grant select, insert on public.workspace_switch_logs to authenticated;
grant select on public.creator_pages to anon;
grant select on public.creator_page_blocks to anon;
grant select on public.creator_calendar_slots to anon;
grant select, insert, update, delete on public.creator_pages to authenticated;
grant select, insert, update, delete on public.creator_page_blocks to authenticated;
grant select, insert, update, delete on public.creator_calendar_slots to authenticated;
