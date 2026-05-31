create table if not exists public.collab_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  sender_user_id uuid references public.profiles(id) on delete set null,
  sender_type text not null check (sender_type in ('creator', 'brand', 'system')),
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.collab_messages
  drop constraint if exists collab_messages_campaign_id_fkey;

alter table if exists public.collab_messages
  add constraint collab_messages_campaign_id_fkey
  foreign key (campaign_id)
  references public.brand_deals(id)
  on delete cascade;

create index if not exists idx_collab_messages_campaign_created
  on public.collab_messages(campaign_id, created_at);

alter table public.collab_messages enable row level security;

drop policy if exists "workspace members read collab messages" on public.collab_messages;
create policy "workspace members read collab messages"
  on public.collab_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.brand_deals deal
      where deal.id = collab_messages.campaign_id
        and app_private.is_workspace_member(deal.workspace_id)
    )
  );

drop policy if exists "workspace members create collab messages" on public.collab_messages;
create policy "workspace members create collab messages"
  on public.collab_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.brand_deals deal
      where deal.id = collab_messages.campaign_id
        and app_private.is_workspace_member(deal.workspace_id)
    )
  );

grant select, insert on public.collab_messages to authenticated;
