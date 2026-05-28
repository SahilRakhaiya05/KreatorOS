alter table public.creator_pages
  add column if not exists username text,
  add column if not exists headline text,
  add column if not exists background_image_url text,
  add column if not exists theme jsonb not null default '{}'::jsonb,
  add column if not exists seo jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'draft',
  add column if not exists setup_progress int not null default 0,
  add column if not exists published_at timestamptz;

alter table public.creator_pages
  drop constraint if exists creator_pages_status_check;

alter table public.creator_pages
  add constraint creator_pages_status_check check (status in ('draft','published','paused'));

create unique index if not exists creator_pages_username_key on public.creator_pages(username) where username is not null;

alter table public.creator_page_blocks
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists target_url text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists style jsonb not null default '{}'::jsonb;

alter table public.offers
  add column if not exists show_on_bio boolean not null default true,
  add column if not exists show_on_shop boolean not null default true;

alter table public.customers
  add column if not exists page_id uuid references public.creator_pages(id) on delete set null,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists source text,
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists total_spent_cents int not null default 0,
  add column if not exists last_activity_at timestamptz;

update public.customers set full_name = coalesce(full_name, name) where full_name is null and name is not null;

alter table public.orders
  add column if not exists page_id uuid references public.creator_pages(id) on delete set null,
  add column if not exists product_id uuid,
  add column if not exists provider_session_id text,
  add column if not exists provider_payment_intent_id text,
  add column if not exists idempotency_key text,
  add column if not exists paid_at timestamptz;

create unique index if not exists orders_idempotency_key_unique on public.orders(idempotency_key) where idempotency_key is not null;

alter table public.access_grants
  add column if not exists page_id uuid references public.creator_pages(id) on delete set null,
  add column if not exists product_id uuid,
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists access_type text not null default 'offer',
  add column if not exists download_count int not null default 0,
  add column if not exists max_downloads int;

create table if not exists public.creator_social_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  platform text not null,
  url text not null,
  label text,
  icon text,
  category text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  image_url text,
  icon text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  click_count int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_gallery_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  image_url text not null,
  alt_text text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_information (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  email text,
  phone text,
  website text,
  address text,
  show_email boolean not null default true,
  show_phone boolean not null default false,
  show_website boolean not null default true,
  show_address boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id)
);

create table if not exists public.digital_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  cover_image_url text,
  file_path text,
  external_delivery_url text,
  file_type text,
  file_size_bytes bigint,
  price_cents int not null default 0,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft','published','paused','archived')),
  show_on_bio boolean not null default true,
  show_on_shop boolean not null default true,
  download_limit int,
  ai_copy jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, slug)
);

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  title text not null,
  destination_url text not null,
  affiliate_code text,
  network text,
  commission_note text,
  image_url text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  show_on_bio boolean not null default true,
  click_count int not null default 0,
  conversion_count int not null default 0,
  revenue_cents int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_programs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  title text not null,
  description text,
  reward_type text,
  reward_value text,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id)
);

create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  page_id uuid not null references public.creator_pages(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  code text not null unique,
  clicks int not null default 0,
  conversions int not null default 0,
  reward_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  slug text not null unique,
  destination_url text not null,
  ref_type text,
  ref_id uuid,
  campaign_name text,
  source text,
  medium text,
  click_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assistant_id uuid not null references public.creator_ai_assistants(id) on delete cascade,
  source_type text not null check (source_type in ('text','file','url','product','offer','faq','policy')),
  title text not null,
  content text,
  file_path text,
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  page_id uuid references public.creator_pages(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null check (channel in ('dashboard','email','whatsapp')),
  status text not null default 'queued' check (status in ('draft','queued','sent','failed')),
  subject text,
  body text,
  template_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.creator_ai_assistants
  add column if not exists avatar_url text,
  add column if not exists greeting text,
  add column if not exists visibility text not null default 'public',
  add column if not exists allowed_tools jsonb not null default '{}'::jsonb,
  add column if not exists fallback_message text,
  add column if not exists lead_capture_enabled boolean not null default true,
  add column if not exists product_recommendation_enabled boolean not null default true,
  add column if not exists booking_recommendation_enabled boolean not null default true,
  add column if not exists brand_inquiry_enabled boolean not null default true;

alter table public.creator_ai_assistants
  drop constraint if exists creator_ai_assistants_visibility_check;

alter table public.creator_ai_assistants
  add constraint creator_ai_assistants_visibility_check check (visibility in ('public','members_only','disabled'));

alter table public.analytics_events
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists ref_type text,
  add column if not exists ref_id uuid,
  add column if not exists source text,
  add column if not exists medium text,
  add column if not exists campaign text,
  add column if not exists user_agent text,
  add column if not exists ip_hash text;

create index if not exists creator_social_links_page_idx on public.creator_social_links(page_id, sort_order);
create index if not exists custom_links_page_idx on public.custom_links(page_id, sort_order);
create index if not exists photo_gallery_items_page_idx on public.photo_gallery_items(page_id, sort_order);
create index if not exists digital_products_page_status_idx on public.digital_products(page_id, status, show_on_shop);
create index if not exists affiliate_links_page_idx on public.affiliate_links(page_id, status);
create index if not exists short_links_slug_idx on public.short_links(slug) where is_active = true;
create index if not exists analytics_events_ref_idx on public.analytics_events(workspace_id, ref_type, ref_id, created_at desc);

drop trigger if exists creator_social_links_set_updated_at on public.creator_social_links;
create trigger creator_social_links_set_updated_at before update on public.creator_social_links for each row execute function public.set_updated_at();
drop trigger if exists custom_links_set_updated_at on public.custom_links;
create trigger custom_links_set_updated_at before update on public.custom_links for each row execute function public.set_updated_at();
drop trigger if exists contact_information_set_updated_at on public.contact_information;
create trigger contact_information_set_updated_at before update on public.contact_information for each row execute function public.set_updated_at();
drop trigger if exists digital_products_set_updated_at on public.digital_products;
create trigger digital_products_set_updated_at before update on public.digital_products for each row execute function public.set_updated_at();
drop trigger if exists affiliate_links_set_updated_at on public.affiliate_links;
create trigger affiliate_links_set_updated_at before update on public.affiliate_links for each row execute function public.set_updated_at();
drop trigger if exists referral_programs_set_updated_at on public.referral_programs;
create trigger referral_programs_set_updated_at before update on public.referral_programs for each row execute function public.set_updated_at();
drop trigger if exists short_links_set_updated_at on public.short_links;
create trigger short_links_set_updated_at before update on public.short_links for each row execute function public.set_updated_at();
drop trigger if exists creator_knowledge_sources_set_updated_at on public.creator_knowledge_sources;
create trigger creator_knowledge_sources_set_updated_at before update on public.creator_knowledge_sources for each row execute function public.set_updated_at();

alter table public.creator_social_links enable row level security;
alter table public.custom_links enable row level security;
alter table public.photo_gallery_items enable row level security;
alter table public.contact_information enable row level security;
alter table public.digital_products enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.referral_programs enable row level security;
alter table public.referral_links enable row level security;
alter table public.short_links enable row level security;
alter table public.creator_knowledge_sources enable row level security;
alter table public.notifications enable row level security;

create policy "workspace editors manage creator social links" on public.creator_social_links for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads visible creator social links" on public.creator_social_links for select to anon using (is_visible and app_private.can_read_public_page(page_id));
create policy "workspace editors manage custom links" on public.custom_links for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads visible custom links" on public.custom_links for select to anon using (is_visible and app_private.can_read_public_page(page_id));
create policy "workspace editors manage gallery" on public.photo_gallery_items for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads gallery" on public.photo_gallery_items for select to anon using (app_private.can_read_public_page(page_id));
create policy "workspace editors manage contact information" on public.contact_information for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads contact information" on public.contact_information for select to anon using (app_private.can_read_public_page(page_id));
create policy "workspace editors manage digital products" on public.digital_products for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads published digital products" on public.digital_products for select to anon using (status = 'published' and (show_on_bio or show_on_shop) and app_private.can_read_public_page(page_id));
create policy "workspace editors manage affiliate links" on public.affiliate_links for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads active affiliate links" on public.affiliate_links for select to anon using (status = 'active' and show_on_bio and app_private.can_read_public_page(page_id));
create policy "workspace editors manage referral programs" on public.referral_programs for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "public reads active referral programs" on public.referral_programs for select to anon using (status = 'active' and app_private.can_read_public_page(page_id));
create policy "workspace members read referral links" on public.referral_links for select to authenticated using (app_private.is_workspace_member(workspace_id));
create policy "public reads active short links" on public.short_links for select to anon using (is_active);
create policy "workspace editors manage short links" on public.short_links for all to authenticated using (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (workspace_id is not null and app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "workspace editors manage creator knowledge" on public.creator_knowledge_sources for all to authenticated using (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor'])) with check (app_private.has_workspace_role(workspace_id, array['owner','admin','manager','editor']));
create policy "workspace members read notifications" on public.notifications for select to authenticated using (workspace_id is not null and app_private.is_workspace_member(workspace_id));
create policy "workspace members insert notifications" on public.notifications for insert to authenticated with check (workspace_id is null or app_private.is_workspace_member(workspace_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('page-assets', 'page-assets', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('gallery', 'gallery', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('product-files', 'product-files', false, 52428800, array['application/pdf','application/zip','image/png','image/jpeg','image/webp','text/plain','application/octet-stream'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select on public.creator_social_links, public.custom_links, public.photo_gallery_items, public.contact_information, public.digital_products, public.affiliate_links, public.referral_programs, public.short_links to anon;
grant select, insert, update, delete on public.creator_social_links, public.custom_links, public.photo_gallery_items, public.contact_information, public.digital_products, public.affiliate_links, public.referral_programs, public.referral_links, public.short_links, public.creator_knowledge_sources to authenticated;
grant select, insert on public.notifications to authenticated;
