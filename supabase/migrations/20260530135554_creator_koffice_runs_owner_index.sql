create index if not exists creator_koffice_runs_owner_created_idx
  on public.creator_koffice_runs(owner_id, created_at desc);
