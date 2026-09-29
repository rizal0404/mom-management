create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'ADMIN');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create function public.save_meeting_draft(p_payload jsonb, p_expected_version integer default null)
returns public.meetings language plpgsql security definer set search_path = '' as $$
declare v_meeting public.meetings; v_id uuid := nullif(p_payload->>'id','')::uuid; v_title text := btrim(coalesce(p_payload->>'title',''));
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_active_member() then raise exception 'FORBIDDEN'; end if;
  if v_title = '' then raise exception 'VALIDATION: title wajib diisi'; end if;
  if v_id is null then
    insert into public.meetings(title, starts_at, location_or_link, chair_name, owner_id)
    values (v_title, nullif(p_payload->>'starts_at','')::timestamptz, nullif(p_payload->>'location_or_link',''), nullif(p_payload->>'chair_name',''), auth.uid()) returning * into v_meeting;
  else
    select * into v_meeting from public.meetings where id=v_id for update;
    if not found or (v_meeting.owner_id <> auth.uid() and not public.is_admin()) then raise exception 'FORBIDDEN'; end if;
    if v_meeting.status <> 'DRAFT' then raise exception 'FORBIDDEN'; end if;
    if p_expected_version is null or v_meeting.version <> p_expected_version then raise exception 'CONFLICT'; end if;
    update public.meetings set title=v_title, starts_at=nullif(p_payload->>'starts_at','')::timestamptz, location_or_link=nullif(p_payload->>'location_or_link',''), chair_name=nullif(p_payload->>'chair_name','') where id=v_id returning * into v_meeting;
  end if;
  delete from public.meeting_participants where meeting_id=v_meeting.id;
  insert into public.meeting_participants(meeting_id, profile_id, display_name_snapshot)
  select v_meeting.id, nullif(x->>'profile_id','')::uuid, btrim(x->>'display_name_snapshot') from jsonb_array_elements(coalesce(p_payload->'participants','[]')) x
  where btrim(coalesce(x->>'display_name_snapshot','')) <> '';
  delete from public.meeting_items where meeting_id=v_meeting.id;
  insert into public.meeting_items(meeting_id, position, agenda, discussion, result, kind, draft_pic_id, draft_start_date, draft_due_date)
  select v_meeting.id, row_number() over (), btrim(x->>'agenda'), nullif(x->>'discussion',''), nullif(x->>'result',''), (x->>'kind')::public.meeting_item_kind, nullif(x->>'draft_pic_id','')::uuid, nullif(x->>'draft_start_date','')::date, nullif(x->>'draft_due_date','')::date from jsonb_array_elements(coalesce(p_payload->'items','[]')) x
  where btrim(coalesce(x->>'agenda','')) <> '';
  return v_meeting;
end; $$;
revoke all on function public.save_meeting_draft(jsonb,integer) from public, anon;
grant execute on function public.save_meeting_draft(jsonb,integer) to authenticated;

create function public.delete_meeting_draft(p_id uuid, p_expected_version integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.meetings;
begin
 if auth.uid() is null or not public.is_active_member() then raise exception 'UNAUTHENTICATED'; end if;
 select * into v from public.meetings where id=p_id for update;
 if not found or (v.owner_id <> auth.uid() and not public.is_admin()) or v.status <> 'DRAFT' then raise exception 'FORBIDDEN'; end if;
 if v.version <> p_expected_version then raise exception 'CONFLICT'; end if;
 delete from public.meetings where id=p_id;
end; $$;
revoke all on function public.delete_meeting_draft(uuid,integer) from public, anon;
grant execute on function public.delete_meeting_draft(uuid,integer) to authenticated;
