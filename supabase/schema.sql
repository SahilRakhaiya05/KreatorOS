create extension if not exists pgcrypto;
create extension if not exists vector;

create type workspace_type as enum ('creator','brand','admin');
create type user_role as enum ('owner','admin','member','viewer');
create type public_status as enum ('draft','published','paused');
create type offer_type as enum ('product','booking','membership','course','bundle','brand_package','lead_magnet');
create type workflow_status as enum ('draft','active','paused','archived');
create type approval_status as enum ('pending','approved','rejected','expired');
create type payment_status as enum ('pending','paid','failed','refunded','cancelled');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  account_type text check (account_type is null or account_type in ('user', 'creator', 'business', 'admin')),
  onboarding_completed boolean not null default false,
  preferences jsonb not null default '{}',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  type workspace_type not null,
  name text not null,
  slug text unique not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role user_role not null default 'member',
  created_at timestamptz default now(),
  primary key (workspace_id,user_id)
);

create table creator_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid unique not null references workspaces(id) on delete cascade,
  display_name text not null,
  username text unique not null,
  niche text,
  audience text,
  promise text,
  theme jsonb default '{}',
  status public_status default 'draft',
  published_at timestamptz,
  created_at timestamptz default now()
);

create table page_blocks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  block_type text not null,
  title text not null,
  subtitle text,
  ref_type text,
  ref_id uuid,
  sort_order int default 0,
  behavior jsonb default '{}',
  style jsonb default '{}',
  is_visible boolean default true,
  created_at timestamptz default now()
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type offer_type not null,
  title text not null,
  slug text not null,
  description text,
  price_cents int default 0,
  currency text default 'usd',
  config jsonb default '{}',
  status public_status default 'draft',
  created_at timestamptz default now(),
  unique(workspace_id, slug)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text,
  phone text,
  full_name text,
  source text,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  offer_id uuid references offers(id) on delete set null,
  status payment_status default 'pending',
  amount_cents int not null,
  currency text default 'usd',
  provider text,
  provider_session_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  offer_id uuid references offers(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text default 'UTC',
  status text default 'pending',
  meeting_url text,
  provider_event_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table brand_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_workspace_id uuid not null references workspaces(id) on delete cascade,
  creator_workspace_id uuid references workspaces(id) on delete set null,
  title text not null,
  brief jsonb default '{}',
  stage text default 'draft',
  budget_cents int,
  currency text default 'usd',
  created_at timestamptz default now()
);

create table collab_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references brand_campaigns(id) on delete cascade,
  sender_user_id uuid references profiles(id) on delete set null,
  sender_type text not null,
  body text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  status workflow_status default 'draft',
  trigger_event text not null,
  graph jsonb not null default '{"nodes":[],"edges":[]}',
  version int default 1,
  created_at timestamptz default now()
);

create table workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references workflows(id) on delete set null,
  workspace_id uuid references workspaces(id) on delete cascade,
  event_type text not null,
  event_payload jsonb default '{}',
  status text default 'running',
  logs jsonb default '[]',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table ai_agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  scope text,
  tools jsonb default '[]',
  policy jsonb default '{}',
  memory_config jsonb default '{}',
  created_at timestamptz default now()
);

create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  requested_by_agent_id uuid references ai_agents(id) on delete set null,
  action_type text not null,
  payload jsonb not null,
  risk_level text default 'medium',
  status approval_status default 'pending',
  decided_by uuid references profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create table research_studies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null,
  goal text,
  language text default 'en',
  status text default 'draft',
  script jsonb default '{}',
  created_at timestamptz default now()
);

create table research_participants (
  id uuid primary key default gen_random_uuid(),
  study_id uuid references research_studies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  email text,
  phone text,
  timezone text,
  status text default 'imported',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table research_interviews (
  id uuid primary key default gen_random_uuid(),
  study_id uuid references research_studies(id) on delete cascade,
  participant_id uuid references research_participants(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  transcript text,
  summary jsonb default '{}',
  recording_url text,
  created_at timestamptz default now()
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  event_type text not null,
  visitor_id text,
  customer_id uuid references customers(id) on delete set null,
  ref_type text,
  ref_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  actor_type text not null,
  actor_id text,
  action text not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_workspace_members_user on workspace_members(user_id);
create index idx_page_blocks_workspace_order on page_blocks(workspace_id, sort_order);
create index idx_offers_workspace_type on offers(workspace_id, type);
create index idx_bookings_workspace_start on bookings(workspace_id, start_at);
create index idx_analytics_workspace_created on analytics_events(workspace_id, created_at);
create index idx_audit_workspace_created on audit_logs(workspace_id, created_at);
