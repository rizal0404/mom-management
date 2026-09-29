drop policy meetings_read_authorized on public.meetings;
create policy meetings_read_authorized on public.meetings for select to authenticated
using (public.is_active_member() and (status = 'FINAL' or owner_id = auth.uid() or public.is_admin()));

drop policy meeting_participants_read_authorized on public.meeting_participants;
create policy meeting_participants_read_authorized on public.meeting_participants for select to authenticated
using (public.is_active_member() and exists (select 1 from public.meetings m where m.id = meeting_id and (m.status = 'FINAL' or m.owner_id = auth.uid() or public.is_admin())));

drop policy meeting_items_read_authorized on public.meeting_items;
create policy meeting_items_read_authorized on public.meeting_items for select to authenticated
using (public.is_active_member() and exists (select 1 from public.meetings m where m.id = meeting_id and (m.status = 'FINAL' or m.owner_id = auth.uid() or public.is_admin())));
