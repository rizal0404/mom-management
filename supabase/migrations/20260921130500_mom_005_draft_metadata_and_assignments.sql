-- MOM-005 needs the draft fields that are promoted atomically on finalization.
-- This replaces the earlier draft RPC without changing an applied migration.
create or replace function public.save_meeting_draft(p_payload jsonb, p_expected_version integer default null)
returns public.meetings language plpgsql security definer set search_path = '' as $$
declare
  v public.meetings;
  x jsonb;
  keep_ids uuid[] := '{}';
  payload_meeting_id uuid := nullif(p_payload->>'id','')::uuid;
  child_id uuid;
begin
  if auth.uid() is null or not public.is_active_member() then raise exception 'UNAUTHENTICATED'; end if;
  if btrim(coalesce(p_payload->>'title',''))='' then raise exception 'VALIDATION: title wajib diisi'; end if;

  if payload_meeting_id is null then
    insert into public.meetings(title, starts_at, location_or_link, chair_name, owner_id)
    values (
      btrim(p_payload->>'title'),
      nullif(p_payload->>'starts_at','')::timestamptz,
      nullif(p_payload->>'location_or_link',''),
      nullif(p_payload->>'chair_name',''),
      auth.uid()
    ) returning * into v;
  else
    select * into v from public.meetings where id=payload_meeting_id for update;
    if not found or v.status<>'DRAFT' or (v.owner_id<>auth.uid() and not public.is_admin()) then raise exception 'FORBIDDEN'; end if;
    if p_expected_version is null or v.version<>p_expected_version then raise exception 'CONFLICT'; end if;
    update public.meetings
    set title=btrim(p_payload->>'title'),
        starts_at=nullif(p_payload->>'starts_at','')::timestamptz,
        location_or_link=nullif(p_payload->>'location_or_link',''),
        chair_name=nullif(p_payload->>'chair_name','')
    where id=payload_meeting_id returning * into v;
  end if;

  for x in select value from jsonb_array_elements(coalesce(p_payload->'participants','[]')) loop
    if btrim(coalesce(x->>'display_name_snapshot',''))='' then continue; end if;
    if nullif(x->>'id','') is not null and exists(select 1 from public.meeting_participants where id=(x->>'id')::uuid and meeting_id=v.id) then
      update public.meeting_participants
      set profile_id=nullif(x->>'profile_id','')::uuid,
          display_name_snapshot=btrim(x->>'display_name_snapshot')
      where id=(x->>'id')::uuid;
      keep_ids:=array_append(keep_ids,(x->>'id')::uuid);
    else
      insert into public.meeting_participants(meeting_id,profile_id,display_name_snapshot)
      values(v.id,nullif(x->>'profile_id','')::uuid,btrim(x->>'display_name_snapshot'))
      returning id into child_id;
      keep_ids:=array_append(keep_ids,child_id);
    end if;
  end loop;
  delete from public.meeting_participants where meeting_id=v.id and not(id=any(keep_ids));

  keep_ids := '{}';
  for x in select value from jsonb_array_elements(coalesce(p_payload->'items','[]')) loop
    if btrim(coalesce(x->>'agenda',''))='' then continue; end if;
    if nullif(x->>'id','') is not null and exists(select 1 from public.meeting_items where id=(x->>'id')::uuid and meeting_id=v.id) then
      update public.meeting_items
      set position=coalesce((x->>'position')::int,1),
          agenda=btrim(x->>'agenda'),
          discussion=nullif(x->>'discussion',''),
          result=nullif(x->>'result',''),
          kind=(x->>'kind')::public.meeting_item_kind,
          draft_pic_id=nullif(x->>'draft_pic_id','')::uuid,
          draft_start_date=nullif(x->>'draft_start_date','')::date,
          draft_due_date=nullif(x->>'draft_due_date','')::date
      where id=(x->>'id')::uuid;
      keep_ids:=array_append(keep_ids,(x->>'id')::uuid);
    else
      insert into public.meeting_items(
        meeting_id,position,agenda,discussion,result,kind,draft_pic_id,draft_start_date,draft_due_date
      ) values (
        v.id,coalesce((x->>'position')::int,1),btrim(x->>'agenda'),nullif(x->>'discussion',''),
        nullif(x->>'result',''),(x->>'kind')::public.meeting_item_kind,
        nullif(x->>'draft_pic_id','')::uuid,nullif(x->>'draft_start_date','')::date,nullif(x->>'draft_due_date','')::date
      ) returning id into child_id;
      keep_ids:=array_append(keep_ids,child_id);
    end if;
  end loop;
  delete from public.meeting_items where meeting_id=v.id and not(id=any(keep_ids));
  return v;
end $$;
