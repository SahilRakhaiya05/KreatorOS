create table if not exists public.instagram_captures (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  platform text not null default 'instagram',
  media_type text not null default 'instagram_page',
  status text not null default 'pending' check (status in ('pending', 'analyzed', 'failed')),
  url text not null,
  canonical_url text not null,
  shortcode text,
  username text,
  story_id text,
  title text,
  caption text,
  thumbnail_url text,
  media_image_urls text[] not null default '{}',
  media_video_urls text[] not null default '{}',
  raw_payload jsonb not null default '{}'::jsonb,
  raw_text text,
  summary text,
  hook text,
  content_format text,
  sentiment text,
  language text,
  tags text[] not null default '{}',
  topics text[] not null default '{}',
  opportunities text[] not null default '{}',
  analysis jsonb not null default '{}'::jsonb,
  captured_at timestamptz,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists instagram_captures_owner_canonical_url_idx
  on public.instagram_captures(owner_id, canonical_url);

create index if not exists instagram_captures_owner_created_idx
  on public.instagram_captures(owner_id, created_at desc);

create index if not exists instagram_captures_workspace_created_idx
  on public.instagram_captures(workspace_id, created_at desc);

create index if not exists instagram_captures_tags_idx
  on public.instagram_captures using gin(tags);

create index if not exists instagram_captures_topics_idx
  on public.instagram_captures using gin(topics);

alter table public.instagram_captures enable row level security;

drop policy if exists "account owners manage instagram captures" on public.instagram_captures;
create policy "account owners manage instagram captures" on public.instagram_captures
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
