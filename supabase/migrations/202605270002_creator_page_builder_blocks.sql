create table if not exists public.creator_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  handle text not null,
  bio text,
  avatar_url text,
  theme_name text not null default 'Studio',
  layout text not null default 'Stacked commerce',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  type text not null check (type in ('link', 'calendar', 'product', 'membership', 'lead_magnet', 'brand_intake', 'ai_concierge')),
  title text not null,
  subtitle text,
  url text,
  status text not null default 'live' check (status in ('live', 'draft')),
  sort_order int not null default 0,
  clicks int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_pages_owner_id_idx on public.creator_pages(owner_id);
create index if not exists creator_pages_slug_idx on public.creator_pages(slug);
create index if not exists creator_page_blocks_page_order_idx on public.creator_page_blocks(page_id, sort_order);

drop trigger if exists creator_pages_set_updated_at on public.creator_pages;
create trigger creator_pages_set_updated_at
before update on public.creator_pages
for each row execute function public.set_updated_at();

drop trigger if exists creator_page_blocks_set_updated_at on public.creator_page_blocks;
create trigger creator_page_blocks_set_updated_at
before update on public.creator_page_blocks
for each row execute function public.set_updated_at();

alter table public.creator_pages enable row level security;
alter table public.creator_page_blocks enable row level security;

drop policy if exists "owner manages creator pages" on public.creator_pages;
drop policy if exists "public reads published creator pages" on public.creator_pages;
drop policy if exists "owner manages creator page blocks" on public.creator_page_blocks;
drop policy if exists "public reads live creator page blocks" on public.creator_page_blocks;

create policy "owner manages creator pages" on public.creator_pages
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "public reads published creator pages" on public.creator_pages
for select
to anon
using (is_published = true);

create policy "owner manages creator page blocks" on public.creator_page_blocks
for all
to authenticated
using (exists (
  select 1 from public.creator_pages page
  where page.id = creator_page_blocks.page_id
    and page.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.creator_pages page
  where page.id = creator_page_blocks.page_id
    and page.owner_id = (select auth.uid())
));

create policy "public reads live creator page blocks" on public.creator_page_blocks
for select
to anon
using (
  status = 'live'
  and exists (
    select 1 from public.creator_pages page
    where page.id = creator_page_blocks.page_id
      and page.is_published = true
  )
);
