-- MOM-014: owner-private agenda templates and guarded draft instantiation.

create table public.meeting_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  initial_title text check (
    initial_title is null or char_length(btrim(initial_title)) between 1 and 250
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1)
);

create index meeting_templates_owner_updated_idx
  on public.meeting_templates (owner_id, updated_at desc);

create table public.meeting_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.meeting_templates (id) on delete cascade,
  position integer not null check (position > 0),
  agenda text not null check (char_length(btrim(agenda)) between 1 and 2000),
  kind public.meeting_item_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1),
  constraint meeting_template_items_position_once unique (template_id, position)
);

create trigger meeting_templates_set_mutable_metadata before update on public.meeting_templates
for each row execute function public.set_mutable_metadata();
create trigger meeting_template_items_set_mutable_metadata before update on public.meeting_template_items
for each row execute function public.set_mutable_metadata();

alter table public.meeting_templates enable row level security;
alter table public.meeting_template_items enable row level security;

grant select on public.meeting_templates, public.meeting_template_items to authenticated;
create policy meeting_templates_read_owner on public.meeting_templates for select to authenticated
using (public.is_active_member() and owner_id = auth.uid());
create policy meeting_template_items_read_owner on public.meeting_template_items for select to authenticated
using (
  public.is_active_member()
  and exists (
    select 1 from public.meeting_templates t
    where t.id = template_id and t.owner_id = auth.uid()
  )
);
revoke all on public.meeting_templates, public.meeting_template_items from anon;
revoke insert, update, delete on public.meeting_templates, public.meeting_template_items from authenticated;

create function public.save_meeting_template(p_payload jsonb, p_expected_version integer default null)
returns public.meeting_templates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template public.meeting_templates;
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_name text := btrim(coalesce(p_payload->>'name', ''));
  v_initial_title text := nullif(btrim(coalesce(p_payload->>'initial_title', '')), '');
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_active_member() then raise exception 'FORBIDDEN'; end if;
  if coalesce(jsonb_typeof(p_payload), '') <> 'object' then
    raise exception 'VALIDATION: Data template tidak valid.';
  end if;
  if char_length(v_name) not between 1 and 120 then
    raise exception 'VALIDATION: Nama template wajib diisi (maksimal 120 karakter).';
  end if;
  if v_initial_title is not null and char_length(v_initial_title) > 250 then
    raise exception 'VALIDATION: Judul awal maksimal 250 karakter.';
  end if;
  if coalesce(jsonb_typeof(p_payload->'items'), '') <> 'array' then
    raise exception 'VALIDATION: Tambahkan minimal satu agenda.';
  end if;
  if jsonb_array_length(p_payload->'items') = 0 then
    raise exception 'VALIDATION: Tambahkan minimal satu agenda.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_payload->'items') as entries(value)
    where jsonb_typeof(entries.value) <> 'object'
      or char_length(btrim(coalesce(entries.value->>'agenda', ''))) not between 1 and 2000
      or coalesce(entries.value->>'kind', '') not in ('NOTE', 'DECISION', 'TASK', 'PENDING_MATTER')
  ) then
    raise exception 'VALIDATION: Isi agenda dan jenis item dengan benar.';
  end if;

  if v_id is null then
    insert into public.meeting_templates (owner_id, name, initial_title)
    values (auth.uid(), v_name, v_initial_title)
    returning * into v_template;
  else
    select * into v_template
    from public.meeting_templates
    where id = v_id
    for update;
    if not found or v_template.owner_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
    if p_expected_version is null or v_template.version <> p_expected_version then
      raise exception 'CONFLICT';
    end if;
    update public.meeting_templates
    set name = v_name, initial_title = v_initial_title
    where id = v_id
    returning * into v_template;
    delete from public.meeting_template_items where template_id = v_id;
  end if;

  insert into public.meeting_template_items (template_id, position, agenda, kind)
  select v_template.id, entries.ordinality::integer, btrim(entries.value->>'agenda'),
    (entries.value->>'kind')::public.meeting_item_kind
  from jsonb_array_elements(p_payload->'items') with ordinality as entries(value, ordinality);

  return v_template;
end;
$$;
revoke all on function public.save_meeting_template(jsonb, integer) from public, anon;
grant execute on function public.save_meeting_template(jsonb, integer) to authenticated;

create function public.delete_meeting_template(p_id uuid, p_expected_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template public.meeting_templates;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_active_member() then raise exception 'FORBIDDEN'; end if;
  select * into v_template
  from public.meeting_templates
  where id = p_id
  for update;
  if not found or v_template.owner_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if p_expected_version is null or v_template.version <> p_expected_version then
    raise exception 'CONFLICT';
  end if;
  delete from public.meeting_templates where id = p_id;
end;
$$;
revoke all on function public.delete_meeting_template(uuid, integer) from public, anon;
grant execute on function public.delete_meeting_template(uuid, integer) to authenticated;

create function public.create_meeting_draft_from_template(p_template_id uuid)
returns public.meetings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template public.meeting_templates;
  v_meeting public.meetings;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not public.is_active_member() then raise exception 'FORBIDDEN'; end if;
  select * into v_template
  from public.meeting_templates
  where id = p_template_id and owner_id = auth.uid()
  for share;
  if not found then raise exception 'FORBIDDEN'; end if;
  if not exists (
    select 1 from public.meeting_template_items where template_id = v_template.id
  ) then
    raise exception 'VALIDATION: Template belum memiliki agenda.';
  end if;

  insert into public.meetings (title, owner_id)
  values (coalesce(v_template.initial_title, v_template.name), auth.uid())
  returning * into v_meeting;

  insert into public.meeting_items (meeting_id, position, agenda, discussion, result, kind)
  select v_meeting.id, source.position, source.agenda, null, null, source.kind
  from public.meeting_template_items as source
  where source.template_id = v_template.id
  order by source.position;

  return v_meeting;
end;
$$;
revoke all on function public.create_meeting_draft_from_template(uuid) from public, anon;
grant execute on function public.create_meeting_draft_from_template(uuid) to authenticated;
