create table if not exists public.creator_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New chat',
  agent_id text not null default 'operator',
  messages jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_chat_sessions_workspace_updated_idx
on public.creator_chat_sessions(workspace_id, updated_at desc);

create index if not exists creator_chat_sessions_created_by_idx
on public.creator_chat_sessions(created_by, updated_at desc);

drop trigger if exists creator_chat_sessions_set_updated_at on public.creator_chat_sessions;
create trigger creator_chat_sessions_set_updated_at
before update on public.creator_chat_sessions
for each row execute function public.set_updated_at();

alter table public.creator_chat_sessions enable row level security;

drop policy if exists "workspace members read creator chat sessions" on public.creator_chat_sessions;
drop policy if exists "workspace members insert creator chat sessions" on public.creator_chat_sessions;
drop policy if exists "workspace members update own creator chat sessions" on public.creator_chat_sessions;
drop policy if exists "workspace members delete own creator chat sessions" on public.creator_chat_sessions;

create policy "workspace members read creator chat sessions"
on public.creator_chat_sessions
for select
to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy "workspace members insert creator chat sessions"
on public.creator_chat_sessions
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and app_private.is_workspace_member(workspace_id)
);

create policy "workspace members update own creator chat sessions"
on public.creator_chat_sessions
for update
to authenticated
using (
  created_by = (select auth.uid())
  and app_private.is_workspace_member(workspace_id)
)
with check (
  created_by = (select auth.uid())
  and app_private.is_workspace_member(workspace_id)
);

create policy "workspace members delete own creator chat sessions"
on public.creator_chat_sessions
for delete
to authenticated
using (
  created_by = (select auth.uid())
  and app_private.is_workspace_member(workspace_id)
);

grant select, insert, update, delete on public.creator_chat_sessions to authenticated;
