create table if not exists public.creator_calendar_slots (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.creator_page_blocks(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  status text not null default 'available' check (status in ('available', 'held', 'booked', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_calendar_slots_block_start_idx on public.creator_calendar_slots(block_id, starts_at);
create index if not exists creator_calendar_slots_page_start_idx on public.creator_calendar_slots(page_id, starts_at);

drop trigger if exists creator_calendar_slots_set_updated_at on public.creator_calendar_slots;
create trigger creator_calendar_slots_set_updated_at
before update on public.creator_calendar_slots
for each row execute function public.set_updated_at();

alter table public.creator_calendar_slots enable row level security;

drop policy if exists "owner manages creator calendar slots" on public.creator_calendar_slots;
drop policy if exists "public reads available creator calendar slots" on public.creator_calendar_slots;

create policy "owner manages creator calendar slots" on public.creator_calendar_slots
for all
to authenticated
using (exists (
  select 1 from public.creator_pages page
  where page.id = creator_calendar_slots.page_id
    and page.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.creator_pages page
  where page.id = creator_calendar_slots.page_id
    and page.owner_id = (select auth.uid())
));

create policy "public reads available creator calendar slots" on public.creator_calendar_slots
for select
to anon
using (
  status = 'available'
  and exists (
    select 1 from public.creator_pages page
    where page.id = creator_calendar_slots.page_id
      and page.is_published = true
  )
);
