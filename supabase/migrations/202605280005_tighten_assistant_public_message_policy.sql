drop policy if exists "public creates assistant messages" on public.assistant_chat_messages;
create policy "public creates assistant messages" on public.assistant_chat_messages
for insert
to anon
with check (
  exists (
    select 1
    from public.assistant_chat_sessions session
    join public.creator_ai_assistants assistant on assistant.id = session.assistant_id
    where session.id = assistant_chat_messages.session_id
      and session.workspace_id = assistant_chat_messages.workspace_id
      and session.assistant_id = assistant_chat_messages.assistant_id
      and assistant.status = 'active'
      and app_private.can_read_public_page(session.page_id)
  )
);
