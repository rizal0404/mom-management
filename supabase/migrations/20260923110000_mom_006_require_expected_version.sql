-- MOM-006 / A04: mutable update/finalize/delete RPCs require an explicit optimistic-lock version.

create or replace function public.update_action(
  p_id uuid,
  p_expected_version integer,
  p_patch jsonb default '{}'::jsonb,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action public.actions;
  v_meeting public.meetings;
  v_before jsonb;
  v_after jsonb;
  v_title text;
  v_description text;
  v_pic_id uuid;
  v_start_date date;
  v_due_date date;
  v_status public.action_status;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_is_owner boolean;
  v_is_admin boolean;
  v_keys text[];
begin
  if auth.uid() is null or not public.is_active_member() then
    raise exception 'UNAUTHENTICATED';
  end if;
  if p_expected_version is null then
    raise exception 'CONFLICT';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'VALIDATION: patch harus berupa objek';
  end if;

  select * into v_action from public.actions where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select m.* into v_meeting
  from public.meetings m
  join public.meeting_items i on i.meeting_id = m.id
  where i.id = v_action.source_item_id;
  if not found then raise exception 'NOT_FOUND'; end if;

  v_is_owner := v_meeting.owner_id = auth.uid();
  v_is_admin := public.is_admin();
  if not v_is_owner and not v_is_admin and v_action.pic_id <> auth.uid() then
    raise exception 'FORBIDDEN';
  end if;
  if v_action.version <> p_expected_version then raise exception 'CONFLICT'; end if;

  select coalesce(array_agg(key), '{}') into v_keys from jsonb_object_keys(p_patch) key;
  if exists (select 1 from unnest(v_keys) key where key not in ('title', 'description', 'pic_id', 'start_date', 'due_date', 'status')) then
    raise exception 'VALIDATION: field update tidak dikenali';
  end if;
  if not (v_is_owner or v_is_admin)
     and exists (select 1 from unnest(v_keys) key where key in ('title', 'description', 'pic_id', 'start_date', 'due_date')) then
    raise exception 'FORBIDDEN';
  end if;

  v_title := v_action.title;
  v_description := v_action.description;
  v_pic_id := v_action.pic_id;
  v_start_date := v_action.start_date;
  v_due_date := v_action.due_date;
  v_status := v_action.status;

  if p_patch ? 'title' then v_title := btrim(coalesce(p_patch->>'title', '')); end if;
  if p_patch ? 'description' then v_description := nullif(btrim(coalesce(p_patch->>'description', '')), ''); end if;
  if p_patch ? 'pic_id' then v_pic_id := nullif(p_patch->>'pic_id', '')::uuid; end if;
  if p_patch ? 'start_date' then v_start_date := nullif(p_patch->>'start_date', '')::date; end if;
  if p_patch ? 'due_date' then v_due_date := nullif(p_patch->>'due_date', '')::date; end if;
  if p_patch ? 'status' then v_status := (p_patch->>'status')::public.action_status; end if;

  if char_length(v_title) < 1 or char_length(v_title) > 250 then raise exception 'VALIDATION: judul wajib diisi'; end if;
  if v_start_date is null or v_due_date is null or v_due_date < v_start_date then raise exception 'VALIDATION: jadwal tidak valid'; end if;
  if not exists (select 1 from public.profiles where id = v_pic_id and is_active) then raise exception 'VALIDATION: PIC aktif wajib dipilih'; end if;

  if v_status = 'CANCELLED' and not (v_is_owner or v_is_admin) then raise exception 'FORBIDDEN'; end if;
  if v_action.status in ('DONE', 'CANCELLED') and v_status <> 'OPEN' and v_status <> v_action.status then
    raise exception 'VALIDATION: action terminal hanya dapat dibuka kembali ke OPEN';
  end if;
  if v_action.status in ('DONE', 'CANCELLED') and v_status = 'OPEN' and not (v_is_owner or v_is_admin) then raise exception 'FORBIDDEN'; end if;
  if v_status in ('BLOCKED', 'DONE', 'CANCELLED') and v_status <> v_action.status and v_note is null then
    raise exception 'VALIDATION: catatan wajib untuk status ini';
  end if;
  if v_action.status in ('DONE', 'CANCELLED') and v_status = 'OPEN' and v_note is null then
    raise exception 'VALIDATION: alasan membuka kembali wajib diisi';
  end if;

  v_before := jsonb_build_object(
    'title', v_action.title,
    'description', v_action.description,
    'pic_id', v_action.pic_id,
    'start_date', v_action.start_date,
    'due_date', v_action.due_date,
    'status', v_action.status::text
  );

  update public.actions
  set title = v_title,
      description = v_description,
      pic_id = v_pic_id,
      start_date = v_start_date,
      due_date = v_due_date,
      status = v_status,
      closed_at = case when v_status in ('DONE', 'CANCELLED') then coalesce(closed_at, now()) else null end
  where id = p_id;

  select * into v_action from public.actions where id = p_id;
  v_after := jsonb_build_object(
    'title', v_action.title,
    'description', v_action.description,
    'pic_id', v_action.pic_id,
    'start_date', v_action.start_date,
    'due_date', v_action.due_date,
    'status', v_action.status::text
  );
  insert into public.action_updates(action_id, actor_id, note, before_values, after_values)
  values (v_action.id, auth.uid(), v_note, v_before, v_after);

  return jsonb_build_object('id', v_action.id, 'version', v_action.version, 'status', v_action.status, 'closed_at', v_action.closed_at);
end;
$$;

revoke all on function public.update_action(uuid, integer, jsonb, text) from public, anon;
grant execute on function public.update_action(uuid, integer, jsonb, text) to authenticated;

create or replace function public.finalize_meeting(p_id uuid, p_expected_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.meetings; invalid_item uuid; action_count integer;
begin
 if auth.uid() is null or not public.is_active_member() then raise exception 'UNAUTHENTICATED'; end if;
 if p_expected_version is null then raise exception 'CONFLICT'; end if;
 select * into m from public.meetings where id=p_id for update;
 if not found or (m.owner_id<>auth.uid() and not public.is_admin()) then raise exception 'FORBIDDEN'; end if;
 if m.status='FINAL' then select count(*) into action_count from public.actions a join public.meeting_items i on i.id=a.source_item_id where i.meeting_id=m.id; return jsonb_build_object('meeting_id',m.id,'status','FINAL','action_count',action_count,'idempotent',true); end if;
 if m.version<>p_expected_version then raise exception 'CONFLICT'; end if;
 if m.starts_at is null or btrim(coalesce(m.chair_name,''))='' then raise exception 'VALIDATION: waktu dan pimpinan wajib'; end if;
 if not exists(select 1 from public.meeting_participants where meeting_id=m.id) then raise exception 'VALIDATION: minimal satu peserta wajib'; end if;
 if not exists(select 1 from public.meeting_items where meeting_id=m.id) then raise exception 'VALIDATION: minimal satu item wajib'; end if;
 select id into invalid_item from public.meeting_items where meeting_id=m.id and btrim(coalesce(result,''))='' limit 1;
 if invalid_item is not null then raise exception 'VALIDATION: hasil item wajib'; end if;
 select i.id into invalid_item from public.meeting_items i left join public.profiles p on p.id=i.draft_pic_id where i.meeting_id=m.id and i.kind in ('TASK','PENDING_MATTER') and (i.draft_pic_id is null or not coalesce(p.is_active,false) or i.draft_start_date is null or i.draft_due_date is null) limit 1;
 if invalid_item is not null then raise exception 'VALIDATION: PIC aktif dan jadwal wajib'; end if;
 insert into public.actions(source_item_id,kind,title,description,pic_id,start_date,due_date,status)
 select i.id,i.kind,i.agenda,i.result,i.draft_pic_id,i.draft_start_date,i.draft_due_date,'OPEN' from public.meeting_items i where i.meeting_id=m.id and i.kind in ('TASK','PENDING_MATTER') on conflict(source_item_id) do nothing;
 select count(*) into action_count from public.actions a join public.meeting_items i on i.id=a.source_item_id where i.meeting_id=m.id;
 update public.meetings set status='FINAL',finalized_at=now() where id=m.id;
 return jsonb_build_object('meeting_id',m.id,'status','FINAL','action_count',action_count,'idempotent',false);
end $$;
revoke all on function public.finalize_meeting(uuid,integer) from public, anon;
grant execute on function public.finalize_meeting(uuid,integer) to authenticated;

create or replace function public.delete_meeting_draft(p_id uuid, p_expected_version integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.meetings;
begin
 if auth.uid() is null or not public.is_active_member() then raise exception 'UNAUTHENTICATED'; end if;
 if p_expected_version is null then raise exception 'CONFLICT'; end if;
 select * into v from public.meetings where id=p_id for update;
 if not found or (v.owner_id <> auth.uid() and not public.is_admin()) or v.status <> 'DRAFT' then raise exception 'FORBIDDEN'; end if;
 if v.version <> p_expected_version then raise exception 'CONFLICT'; end if;
 delete from public.meetings where id=p_id;
end; $$;
revoke all on function public.delete_meeting_draft(uuid,integer) from public, anon;
grant execute on function public.delete_meeting_draft(uuid,integer) to authenticated;
