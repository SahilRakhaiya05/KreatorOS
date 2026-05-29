-- Move Smart Link commerce ownership to the authenticated profile.
-- workspace_id remains nullable as a legacy/internal compatibility field while code migrates.

alter table public.offers add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.products add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.membership_plans add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.courses add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.digital_products add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.creator_social_links add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.custom_links add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.photo_gallery_items add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.contact_information add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.affiliate_links add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.referral_programs add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.referral_links add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.short_links add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.creator_knowledge_sources add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.notifications add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.analytics_events add column if not exists owner_id uuid references public.profiles(id) on delete set null;

update public.offers row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.products row set owner_id = coalesce(
  row.owner_id,
  (select offer.owner_id from public.offers offer where offer.id = row.offer_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.membership_plans row set owner_id = coalesce(
  row.owner_id,
  (select offer.owner_id from public.offers offer where offer.id = row.offer_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.courses row set owner_id = coalesce(
  row.owner_id,
  (select offer.owner_id from public.offers offer where offer.id = row.offer_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.digital_products row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.creator_social_links row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.custom_links row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.photo_gallery_items row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.contact_information row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.affiliate_links row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.referral_programs row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.referral_links row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.short_links row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

update public.analytics_events row set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
) where row.owner_id is null;

alter table public.offers alter column workspace_id drop not null;
alter table public.products alter column workspace_id drop not null;
alter table public.membership_plans alter column workspace_id drop not null;
alter table public.courses alter column workspace_id drop not null;
alter table public.digital_products alter column workspace_id drop not null;
alter table public.creator_social_links alter column workspace_id drop not null;
alter table public.custom_links alter column workspace_id drop not null;
alter table public.photo_gallery_items alter column workspace_id drop not null;
alter table public.contact_information alter column workspace_id drop not null;
alter table public.affiliate_links alter column workspace_id drop not null;
alter table public.referral_programs alter column workspace_id drop not null;
alter table public.referral_links alter column workspace_id drop not null;

create index if not exists offers_owner_idx on public.offers(owner_id, type, created_at desc);
create index if not exists products_owner_idx on public.products(owner_id, created_at desc);
create index if not exists membership_plans_owner_idx on public.membership_plans(owner_id, created_at desc);
create index if not exists courses_owner_idx on public.courses(owner_id, created_at desc);
create index if not exists digital_products_owner_idx on public.digital_products(owner_id, status, created_at desc);
create index if not exists creator_social_links_owner_idx on public.creator_social_links(owner_id);
create index if not exists custom_links_owner_idx on public.custom_links(owner_id);
create index if not exists photo_gallery_items_owner_idx on public.photo_gallery_items(owner_id);
create index if not exists contact_information_owner_idx on public.contact_information(owner_id);
create index if not exists affiliate_links_owner_idx on public.affiliate_links(owner_id);
create index if not exists referral_programs_owner_idx on public.referral_programs(owner_id);
create index if not exists referral_links_owner_idx on public.referral_links(owner_id);
create index if not exists short_links_owner_idx on public.short_links(owner_id);
create index if not exists analytics_events_owner_idx on public.analytics_events(owner_id, created_at desc);

drop policy if exists "account owners manage offers" on public.offers;
create policy "account owners manage offers" on public.offers
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage products" on public.products;
create policy "account owners manage products" on public.products
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage memberships" on public.membership_plans;
create policy "account owners manage memberships" on public.membership_plans
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage courses" on public.courses;
create policy "account owners manage courses" on public.courses
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage digital products" on public.digital_products;
create policy "account owners manage digital products" on public.digital_products
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage creator social links" on public.creator_social_links;
create policy "account owners manage creator social links" on public.creator_social_links
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage custom links" on public.custom_links;
create policy "account owners manage custom links" on public.custom_links
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage gallery" on public.photo_gallery_items;
create policy "account owners manage gallery" on public.photo_gallery_items
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage contact information" on public.contact_information;
create policy "account owners manage contact information" on public.contact_information
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage affiliate links" on public.affiliate_links;
create policy "account owners manage affiliate links" on public.affiliate_links
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage referral programs" on public.referral_programs;
create policy "account owners manage referral programs" on public.referral_programs
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
