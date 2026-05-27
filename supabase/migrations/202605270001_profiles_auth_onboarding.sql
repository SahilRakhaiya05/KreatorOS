alter table public.profiles
  add column if not exists account_type text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

alter table public.profiles
  add constraint profiles_account_type_check
  check (account_type is null or account_type in ('user', 'creator', 'business', 'admin'))
  not valid;

alter table public.profiles validate constraint profiles_account_type_check;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    account_type,
    onboarding_completed,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    null,
    false,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;

create policy "own profile" on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "insert own profile" on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy "update own profile" on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
