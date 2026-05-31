do $$
declare
  fk record;
  index_name text;
begin
  for fk in
    with fk_cols as (
      select
        n.nspname as schema_name,
        c.relname as table_name,
        con.conname as constraint_name,
        con.conrelid,
        con.conkey,
        string_agg(quote_ident(a.attname), ', ' order by u.ord) as column_list
      from pg_constraint con
      join pg_class c on c.oid = con.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      join unnest(con.conkey) with ordinality as u(attnum, ord) on true
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = u.attnum
      where con.contype = 'f'
        and n.nspname = 'public'
      group by n.nspname, c.relname, con.conname, con.conrelid, con.conkey
    )
    select *
    from fk_cols
    where not exists (
      select 1
      from pg_index i
      where i.indrelid = fk_cols.conrelid
        and i.indisvalid
        and i.indisready
        and (i.indkey::int2[])[0:cardinality(fk_cols.conkey)-1] = fk_cols.conkey
    )
    order by table_name, constraint_name
  loop
    index_name := 'idx_fk_' || substr(md5(fk.schema_name || '.' || fk.table_name || '.' || fk.constraint_name), 1, 24);

    execute format(
      'create index if not exists %I on %I.%I (%s)',
      index_name,
      fk.schema_name,
      fk.table_name,
      fk.column_list
    );
  end loop;
end $$;
