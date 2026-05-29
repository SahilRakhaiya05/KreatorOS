-- Treat the authenticated profile account_type as the product-facing source of truth.
-- Existing workspace tables remain as internal tenant data containers for scoped records.

update public.profiles
set account_type = case
  when preferences ->> 'workspaceType' in ('brand', 'agency') then 'business'
  when preferences ->> 'workspaceType' = 'admin' then 'admin'
  when preferences ->> 'workspaceType' in ('creator', 'startup', 'community') then 'creator'
  else account_type
end
where account_type is null
  and preferences ? 'workspaceType';

update public.profiles
set preferences = coalesce(preferences, '{}'::jsonb) || jsonb_build_object('accountType', account_type)
where account_type is not null;

update public.profiles
set preferences = coalesce(preferences, '{}'::jsonb) - 'workspaceType'
where coalesce(preferences, '{}'::jsonb) ? 'workspaceType';
