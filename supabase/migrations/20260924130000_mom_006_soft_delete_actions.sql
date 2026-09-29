-- Preserve action and update history while allowing its owner/admin to hide it
-- from the operational tracker. A deleted action remains an immutable audit row.
alter table public.actions add column deleted_at timestamptz;

create index actions_live_pic_status_due_date_idx
  on public.actions (pic_id, status, due_date) where deleted_at is null;

create function public.prevent_deleted_action_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.deleted_at is not null then
    raise exception 'FORBIDDEN: task yang sudah dihapus tidak dapat diubah';
  end if;
  return new;
end;
$$;

create trigger action_reject_deleted_mutation
before update on public.actions
for each row execute function public.prevent_deleted_action_update();

revoke all on function public.prevent_deleted_action_update() from public, anon, authenticated;

create function public.delete_action(p_id uuid, p_expected_version integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action public.actions;
  v_owner_id uuid;
  v_is_admin boolean;
  v_deleted_at timestamptz;
  v_before jsonb;
  v_after jsonb;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_active_member() then raise exception 'FORBIDDEN'; end if;
  if p_expected_version is null then raise exception 'CONFLICT'; end if;

  select a.* into v_action
  from public.actions a
  where a.id = p_id
  for update;
  if not found then raise exception 'FORBIDDEN'; end if;

  select m.owner_id into v_owner_id
  from public.meeting_items i
  join public.meetings m on m.id = i.meeting_id
  where i.id = v_action.source_item_id;
  if not found then raise exception 'FORBIDDEN'; end if;
  v_is_admin := public.is_admin();
  if v_owner_id <> auth.uid() and not v_is_admin then raise exception 'FORBIDDEN'; end if;

  -- Retrying a committed soft delete is safe and does not append duplicate history.
  if v_action.deleted_at is not null then
    return jsonb_build_object('id', v_action.id, 'deleted', true, 'idempotent', true);
  end if;
  if v_action.version <> p_expected_version then raise exception 'CONFLICT'; end if;

  v_before := jsonb_build_object(
    'title', v_action.title,
    'status', v_action.status::text,
    'deleted_at', null
  );

  update public.actions set deleted_at = now() where id = p_id returning deleted_at into v_deleted_at;
  select * into v_action from public.actions where id = p_id;

  v_after := jsonb_build_object(
    'title', v_action.title,
    'status', v_action.status::text,
    'deleted_at', v_deleted_at
  );
  insert into public.action_updates(action_id, actor_id, note, before_values, after_values)
  values (p_id, auth.uid(), 'Task dihapus dari tracker; riwayat perubahan dipertahankan.', v_before, v_after);

  return jsonb_build_object('id', p_id, 'deleted', true, 'version', v_action.version);
end;
$$;

revoke all on function public.delete_action(uuid, integer) from public, anon;
grant execute on function public.delete_action(uuid, integer) to authenticated;
