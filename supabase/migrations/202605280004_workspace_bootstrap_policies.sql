drop policy if exists "owners read own workspaces before membership" on public.workspaces;
create policy "owners read own workspaces before membership" on public.workspaces
for select
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "owners insert own workspaces" on public.workspaces;
create policy "owners insert own workspaces" on public.workspaces
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "owners bootstrap own membership" on public.workspace_members;
create policy "owners bootstrap own membership" on public.workspace_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
    from public.workspaces workspace
    where workspace.id = workspace_members.workspace_id
      and workspace.owner_id = (select auth.uid())
  )
);
