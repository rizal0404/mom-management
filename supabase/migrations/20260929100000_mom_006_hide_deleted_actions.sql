-- Deleted actions remain in the database for audit but are no longer readable
-- through the member API, including direct action and update queries.
drop policy actions_read_active_members on public.actions;
create policy actions_read_live_active_members on public.actions for select to authenticated
using (public.is_active_member() and deleted_at is null);

drop policy action_updates_read_active_members on public.action_updates;
create policy action_updates_read_live_active_members on public.action_updates for select to authenticated
using (
  public.is_active_member()
  and exists (
    select 1 from public.actions a
    where a.id = action_id and a.deleted_at is null
  )
);
