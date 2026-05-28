create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code text not null,
  name text,
  discount_type text not null check (discount_type in ('percent','amount')),
  discount_value int not null check (discount_value >= 0),
  status text not null default 'active' check (status in ('active','paused','archived')),
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions int,
  redeemed_count int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists public.offer_bundle_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bundle_offer_id uuid not null references public.offers(id) on delete cascade,
  child_offer_id uuid not null references public.offers(id) on delete cascade,
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (bundle_offer_id, child_offer_id)
);

create table if not exists public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  status text not null default 'created' check (status in ('created','provider_required','ready','completed','expired','cancelled','failed')),
  provider text,
  provider_checkout_id text,
  amount_cents int not null default 0,
  discount_cents int not null default 0,
  currency text not null default 'usd',
  return_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  title text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_amount_cents int not null default 0,
  total_amount_cents int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coupons_workspace_status_idx on public.coupons(workspace_id, status);
create index if not exists offer_bundle_items_bundle_idx on public.offer_bundle_items(bundle_offer_id, sort_order);
create index if not exists checkout_intents_workspace_status_idx on public.checkout_intents(workspace_id, status, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at before update on public.coupons for each row execute function public.set_updated_at();

drop trigger if exists checkout_intents_set_updated_at on public.checkout_intents;
create trigger checkout_intents_set_updated_at before update on public.checkout_intents for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;
alter table public.offer_bundle_items enable row level security;
alter table public.checkout_intents enable row level security;
alter table public.order_items enable row level security;

create policy "workspace editors manage coupons" on public.coupons
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "public reads active coupons" on public.coupons
for select to anon
using (status = 'active' and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at > now()));

create policy "workspace editors manage bundle items" on public.offer_bundle_items
for all to authenticated
using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']))
with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));

create policy "public reads published bundle items" on public.offer_bundle_items
for select to anon
using (
  exists (
    select 1 from public.offers bundle
    where bundle.id = bundle_offer_id
      and bundle.status = 'published'
  )
);

create policy "workspace members read checkout intents" on public.checkout_intents
for select to authenticated
using (app_private.is_workspace_member(workspace_id));

create policy "workspace members read order items" on public.order_items
for select to authenticated
using (app_private.is_workspace_member(workspace_id));

grant select on public.coupons, public.offer_bundle_items to anon;
grant select, insert, update, delete on public.coupons, public.offer_bundle_items to authenticated;
grant select on public.checkout_intents, public.order_items to authenticated;
