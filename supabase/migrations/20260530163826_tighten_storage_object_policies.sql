drop policy if exists "Allow authenticated update/delete in public buckets" on storage.objects;
drop policy if exists "Allow authenticated update in public buckets" on storage.objects;
drop policy if exists "Allow authenticated delete in public buckets" on storage.objects;

create policy "Allow authenticated update in public buckets"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('public-assets', 'page-assets', 'gallery')
    and (select auth.uid())::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id in ('public-assets', 'page-assets', 'gallery')
    and (select auth.uid())::text = split_part(name, '/', 1)
  );

create policy "Allow authenticated delete in public buckets"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('public-assets', 'page-assets', 'gallery')
    and (select auth.uid())::text = split_part(name, '/', 1)
  );
