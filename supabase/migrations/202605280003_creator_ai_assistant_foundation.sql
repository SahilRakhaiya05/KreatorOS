create table if not exists public.creator_ai_assistants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  tone text not null default 'helpful',
  welcome_message text not null default 'Tell me what you need help with and I will point you to the right offer.',
  system_prompt text not null default 'You are a public-facing creator assistant. Recommend published offers only. Do not reveal private dashboard data.',
  permissions jsonb not null default '{"recommend_offers":true,"start_booking":true,"start_checkout":true,"capture_leads":true}'::jsonb,
  knowledge_summary text,
  safety_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id)
);

create table if not exists public.assistant_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assistant_id uuid not null references public.creator_ai_assistants(id) on delete cascade,
  source_type text not null check (source_type in ('page', 'offer', 'faq', 'manual', 'file', 'url')),
  title text not null,
  content text,
  source_ref text,
  status text not null default 'active' check (status in ('active', 'disabled', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistant_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  assistant_id uuid not null references public.creator_ai_assistants(id) on delete cascade,
  visitor_id text,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'converted', 'closed', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistant_chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  session_id uuid not null references public.assistant_chat_sessions(id) on delete cascade,
  assistant_id uuid not null references public.creator_ai_assistants(id) on delete cascade,
  role text not null check (role in ('visitor', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  assistant_session_id uuid references public.assistant_chat_sessions(id) on delete set null,
  email text,
  name text,
  source text not null default 'assistant',
  intent text,
  status text not null default 'new' check (status in ('new', 'qualified', 'customer', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_ai_assistants_page_idx on public.creator_ai_assistants(page_id);
create index if not exists assistant_chat_sessions_workspace_idx on public.assistant_chat_sessions(workspace_id, created_at desc);
create index if not exists assistant_chat_messages_session_idx on public.assistant_chat_messages(session_id, created_at);
create index if not exists leads_workspace_status_idx on public.leads(workspace_id, status, created_at desc);

drop trigger if exists creator_ai_assistants_set_updated_at on public.creator_ai_assistants;
create trigger creator_ai_assistants_set_updated_at before update on public.creator_ai_assistants for each row execute function public.set_updated_at();

drop trigger if exists assistant_knowledge_sources_set_updated_at on public.assistant_knowledge_sources;
create trigger assistant_knowledge_sources_set_updated_at before update on public.assistant_knowledge_sources for each row execute function public.set_updated_at();

drop trigger if exists assistant_chat_sessions_set_updated_at on public.assistant_chat_sessions;
create trigger assistant_chat_sessions_set_updated_at before update on public.assistant_chat_sessions for each row execute function public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

alter table public.creator_ai_assistants enable row level security;
alter table public.assistant_knowledge_sources enable row level security;
alter table public.assistant_chat_sessions enable row level security;
alter table public.assistant_chat_messages enable row level security;
alter table public.leads enable row level security;

create policy "workspace members manage creator assistants" on public.creator_ai_assistants
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "public reads active creator assistants" on public.creator_ai_assistants
for select to anon
using (status = 'active' and app_private.can_read_public_page(page_id));

create policy "workspace members manage assistant knowledge" on public.assistant_knowledge_sources
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "workspace members read assistant sessions" on public.assistant_chat_sessions
for select to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy "public creates assistant sessions" on public.assistant_chat_sessions
for insert to anon
with check (app_private.can_read_public_page(page_id));

create policy "workspace members read assistant messages" on public.assistant_chat_messages
for select to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy "public creates assistant messages" on public.assistant_chat_messages
for insert to anon
with check (true);

create policy "workspace members manage leads" on public.leads
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "public creates assistant leads" on public.leads
for insert to anon
with check (page_id is null or app_private.can_read_public_page(page_id));

grant select on public.creator_ai_assistants to anon;
grant insert on public.assistant_chat_sessions, public.assistant_chat_messages, public.leads to anon;
grant select, insert, update, delete on public.creator_ai_assistants, public.assistant_knowledge_sources, public.leads to authenticated;
grant select on public.assistant_chat_sessions, public.assistant_chat_messages to authenticated;
