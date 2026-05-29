-- Migration: Create Storage Buckets and RLS policies for KreatorOS Smart Link file uploads
-- Target: public-assets, page-assets, gallery, and product-files

-- 1. Insert buckets into storage.buckets if they do not exist
insert into storage.buckets (id, name, public)
values 
  ('public-assets', 'public-assets', true),
  ('page-assets', 'page-assets', true),
  ('gallery', 'gallery', true),
  ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- 2. Ensure RLS is active on storage.objects (normally enabled by default)
alter table storage.objects enable row level security;

-- 3. Clear existing custom object policies to avoid conflicts
drop policy if exists "Allow public read access on public buckets" on storage.objects;
drop policy if exists "Allow authenticated upload in public buckets" on storage.objects;
drop policy if exists "Allow authenticated update/delete in public buckets" on storage.objects;
drop policy if exists "Allow private bucket insert for owner" on storage.objects;
drop policy if exists "Allow private bucket read for owner" on storage.objects;

-- 4. Create Public Bucket policies (read for anyone, manage for owner user)
create policy "Allow public read access on public buckets"
  on storage.objects for select
  using (bucket_id in ('public-assets', 'page-assets', 'gallery'));

create policy "Allow authenticated upload in public buckets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('public-assets', 'page-assets', 'gallery') 
    and (select auth.uid())::text = split_part(name, '/', 1)
  );

create policy "Allow authenticated update/delete in public buckets"
  on storage.objects for all to authenticated
  using (
    bucket_id in ('public-assets', 'page-assets', 'gallery') 
    and (select auth.uid())::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id in ('public-assets', 'page-assets', 'gallery') 
    and (select auth.uid())::text = split_part(name, '/', 1)
  );

-- 5. Create Private Bucket policies (restricted insert & read for matching owner folders)
create policy "Allow private bucket insert for owner"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-files' 
    and (select auth.uid())::text = split_part(name, '/', 1)
  );

create policy "Allow private bucket read for owner"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-files' 
    and (select auth.uid())::text = split_part(name, '/', 1)
  );
