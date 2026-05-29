-- Finish moving support records to account ownership.
-- These tables can still keep workspace_id as legacy metadata, but writes should not require it.

update public.creator_knowledge_sources row
set owner_id = coalesce(
  row.owner_id,
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
)
where row.owner_id is null;

update public.notifications row
set owner_id = coalesce(
  row.owner_id,
  (select page.owner_id from public.creator_pages page where page.id = row.page_id),
  (select workspace.owner_id from public.workspaces workspace where workspace.id = row.workspace_id)
)
where row.owner_id is null;

alter table public.creator_knowledge_sources alter column workspace_id drop not null;

create index if not exists creator_knowledge_sources_owner_idx on public.creator_knowledge_sources(owner_id, created_at desc);
create index if not exists notifications_owner_idx on public.notifications(owner_id, created_at desc);

drop policy if exists "account owners manage creator knowledge sources" on public.creator_knowledge_sources;
create policy "account owners manage creator knowledge sources" on public.creator_knowledge_sources
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "account owners manage notifications" on public.notifications;
create policy "account owners manage notifications" on public.notifications
for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
