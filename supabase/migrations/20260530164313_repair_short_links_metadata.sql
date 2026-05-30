alter table public.short_links
  add column if not exists metadata jsonb;

update public.short_links
set metadata = '{}'::jsonb
where metadata is null;

alter table public.short_links
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null;

notify pgrst, 'reload schema';
