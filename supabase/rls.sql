alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table creator_profiles enable row level security;
alter table page_blocks enable row level security;
alter table offers enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table bookings enable row level security;
alter table brand_campaigns enable row level security;
alter table collab_messages enable row level security;
alter table workflows enable row level security;
alter table workflow_runs enable row level security;
alter table ai_agents enable row level security;
alter table approval_requests enable row level security;
alter table research_studies enable row level security;
alter table research_participants enable row level security;
alter table research_interviews enable row level security;
alter table analytics_events enable row level security;
alter table audit_logs enable row level security;

create or replace function is_workspace_member(wid uuid)
returns boolean language sql stable security definer as $$
  select exists(select 1 from workspace_members wm where wm.workspace_id = wid and wm.user_id = auth.uid());
$$;

create policy "own profile" on profiles for select using (id = (select auth.uid()));
create policy "insert own profile" on profiles for insert with check (id = (select auth.uid()));
create policy "update own profile" on profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "workspace members read" on workspaces for select using (is_workspace_member(id));
create policy "workspace owner insert" on workspaces for insert with check (owner_id = auth.uid());
create policy "workspace owner update" on workspaces for update using (owner_id = auth.uid());

create policy "members read own memberships" on workspace_members for select using (user_id = auth.uid() or is_workspace_member(workspace_id));
create policy "workspace data access creator_profiles" on creator_profiles for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access page_blocks" on page_blocks for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access offers" on offers for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access customers" on customers for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access orders" on orders for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access bookings" on bookings for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access workflows" on workflows for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access workflow_runs" on workflow_runs for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access ai_agents" on ai_agents for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access approvals" on approval_requests for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access research" on research_studies for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access analytics" on analytics_events for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "workspace data access audit" on audit_logs for select using (is_workspace_member(workspace_id));

-- Public read policies for published creator pages/offers should be implemented via RPC or safe public views.
-- Avoid directly exposing private customer/payment/workflow tables to anonymous users.
