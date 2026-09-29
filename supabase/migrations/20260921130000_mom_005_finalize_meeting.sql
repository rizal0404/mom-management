create function public.finalize_meeting(p_id uuid, p_expected_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.meetings; invalid_item uuid; action_count integer;
begin
 if auth.uid() is null or not public.is_active_member() then raise exception 'UNAUTHENTICATED'; end if;
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
