create table if not exists public.creator_koffice_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  query text not null,
  audience text,
  angle text,
  provider text not null default 'public_sources',
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'failed')),
  active_step int not null default 0,
  research jsonb not null default '{}'::jsonb,
  source_queue jsonb not null default '[]'::jsonb,
  agents jsonb not null default '[]'::jsonb,
  kanban jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  final_answer text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_koffice_runs_workspace_created_idx
  on public.creator_koffice_runs(workspace_id, created_at desc);

drop trigger if exists creator_koffice_runs_set_updated_at on public.creator_koffice_runs;
create trigger creator_koffice_runs_set_updated_at
before update on public.creator_koffice_runs
for each row execute function public.set_updated_at();

alter table public.creator_koffice_runs enable row level security;

drop policy if exists "workspace editors manage koffice runs" on public.creator_koffice_runs;
create policy "workspace editors manage koffice runs"
on public.creator_koffice_runs
for all
to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

grant select, insert, update, delete on public.creator_koffice_runs to authenticated;
