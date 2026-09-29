-- Private, append-only evidence. Storage metadata is read-only to application SQL;
-- bytes and object records are created together by the Storage API.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 10485760, array[
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

create function public.can_access_evidence(p_kind text, p_id uuid, p_write boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and public.is_active_member() and case
 when p_kind = 'meetings' then exists (
   select 1 from public.meetings m where m.id = p_id
   and (m.owner_id = auth.uid() or public.is_admin() or (not p_write and m.status = 'FINAL'))
 )
 when p_kind = 'actions' then exists (
   select 1 from public.actions a join public.meeting_items i on i.id = a.source_item_id
   join public.meetings m on m.id = i.meeting_id
   where a.id = p_id and a.deleted_at is null and m.status = 'FINAL'
   and (not p_write or a.pic_id = auth.uid() or m.owner_id = auth.uid() or public.is_admin())
 ) else false end;
$$;

create function public.evidence_path_allowed(p_name text, p_write boolean default false)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare parts text[] := string_to_array(p_name, '/');
begin
 if array_length(parts, 1) <> 3 or parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 or parts[3] !~* '^[0-9a-f-]{36}--[a-z0-9_. -]+\.(pdf|jpg|jpeg|png|webp|docx|xlsx)$' then return false; end if;
 return public.can_access_evidence(parts[1], parts[2]::uuid, p_write);
end;
$$;

revoke all on function public.can_access_evidence(text, uuid, boolean), public.evidence_path_allowed(text, boolean) from public, anon;
grant execute on function public.can_access_evidence(text, uuid, boolean), public.evidence_path_allowed(text, boolean) to authenticated;

create policy evidence_read on storage.objects for select to authenticated
using (bucket_id = 'evidence' and public.evidence_path_allowed(name, false));
create policy evidence_append on storage.objects for insert to authenticated
with check (bucket_id = 'evidence' and owner_id = auth.uid()::text and public.evidence_path_allowed(name, true));
-- No update/delete policy: evidence cannot be overwritten, moved, or removed by members.

create function public.list_evidence(p_kind text, p_id uuid, p_offset integer default 0)
returns table (id uuid, path text, file_name text, size bigint, created_at timestamptz, uploader_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.can_access_evidence(p_kind, p_id, false) then raise exception 'FORBIDDEN'; end if;
 return query select o.id, o.name, substring(split_part(o.name, '/', 3) from 39),
 (o.metadata->>'size')::bigint, o.created_at, coalesce(p.display_name, 'Pengguna tidak tersedia')
 from storage.objects o left join public.profiles p on p.id::text = o.owner_id
 where o.bucket_id = 'evidence' and split_part(o.name, '/', 1) = p_kind and split_part(o.name, '/', 2) = p_id::text
 order by o.created_at desc, o.id desc limit 21 offset greatest(0, p_offset);
end;
$$;
revoke all on function public.list_evidence(text, uuid, integer) from public, anon;
grant execute on function public.list_evidence(text, uuid, integer) to authenticated;
