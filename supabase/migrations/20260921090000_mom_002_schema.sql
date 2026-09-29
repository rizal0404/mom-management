-- MOM-002: schema and read-only RLS foundation. Domain writes are deliberately
-- withheld until the guarded RPCs in MOM-004 through MOM-006 are introduced.

create type public.profile_role as enum ('ADMIN', 'MEMBER');
create type public.meeting_status as enum ('DRAFT', 'FINAL');
create type public.meeting_item_kind as enum ('NOTE', 'DECISION', 'TASK', 'PENDING_MATTER');
create type public.action_status as enum ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  role public.profile_role not null default 'MEMBER',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 250),
  starts_at timestamptz,
  location_or_link text,
  chair_name text,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  status public.meeting_status not null default 'DRAFT',
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1),
  constraint meetings_finalization_state check (
    (status = 'DRAFT' and finalized_at is null)
    or (status = 'FINAL' and finalized_at is not null and starts_at is not null
        and char_length(btrim(coalesce(chair_name, ''))) > 0)
  )
);

create table public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete restrict,
  display_name_snapshot text not null check (char_length(btrim(display_name_snapshot)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1),
  constraint meeting_participants_profile_once unique (meeting_id, profile_id)
);

create table public.meeting_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  position integer not null check (position > 0),
  agenda text not null check (char_length(btrim(agenda)) between 1 and 2000),
  discussion text,
  result text,
  kind public.meeting_item_kind not null,
  draft_pic_id uuid references public.profiles (id) on delete restrict,
  draft_start_date date,
  draft_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1),
  constraint meeting_items_position_once unique (meeting_id, position),
  constraint meeting_items_draft_schedule check (
    draft_start_date is null or draft_due_date is null or draft_due_date >= draft_start_date
  ),
  constraint meeting_items_non_action_has_no_assignment check (
    kind in ('TASK', 'PENDING_MATTER')
    or (draft_pic_id is null and draft_start_date is null and draft_due_date is null)
  )
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null unique references public.meeting_items (id) on delete restrict,
  kind public.meeting_item_kind not null check (kind in ('TASK', 'PENDING_MATTER')),
  title text not null check (char_length(btrim(title)) between 1 and 250),
  description text,
  pic_id uuid not null references public.profiles (id) on delete restrict,
  start_date date not null,
  due_date date not null check (due_date >= start_date),
  status public.action_status not null default 'OPEN',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1),
  constraint actions_closed_at_state check (
    (status in ('DONE', 'CANCELLED') and closed_at is not null)
    or (status not in ('DONE', 'CANCELLED') and closed_at is null)
  )
);

create table public.action_updates (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions (id) on delete restrict,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  note text,
  before_values jsonb not null default '{}'::jsonb check (jsonb_typeof(before_values) = 'object'),
  after_values jsonb not null default '{}'::jsonb check (jsonb_typeof(after_values) = 'object')
);

create index meetings_owner_status_starts_at_idx on public.meetings (owner_id, status, starts_at desc);
create index meeting_items_meeting_position_idx on public.meeting_items (meeting_id, position);
create index actions_pic_status_due_date_idx on public.actions (pic_id, status, due_date);
create index action_updates_action_created_at_idx on public.action_updates (action_id, created_at);

create function public.set_mutable_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.version := old.version + 1;
  return new;
end;
$$;

create trigger profiles_set_mutable_metadata before update on public.profiles
for each row execute function public.set_mutable_metadata();
create trigger meetings_set_mutable_metadata before update on public.meetings
for each row execute function public.set_mutable_metadata();
create trigger meeting_participants_set_mutable_metadata before update on public.meeting_participants
for each row execute function public.set_mutable_metadata();
create trigger meeting_items_set_mutable_metadata before update on public.meeting_items
for each row execute function public.set_mutable_metadata();
create trigger actions_set_mutable_metadata before update on public.actions
for each row execute function public.set_mutable_metadata();

revoke all on function public.set_mutable_metadata() from public, anon, authenticated;

create function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

revoke all on function public.is_active_member() from public;
grant execute on function public.is_active_member() to authenticated;

alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_items enable row level security;
alter table public.actions enable row level security;
alter table public.action_updates enable row level security;

grant select on public.profiles, public.meetings, public.meeting_participants,
  public.meeting_items, public.actions, public.action_updates to authenticated;

create policy profiles_read_active_directory on public.profiles for select to authenticated
using (public.is_active_member() and is_active);

create policy meetings_read_authorized on public.meetings for select to authenticated
using (public.is_active_member() and (status = 'FINAL' or owner_id = auth.uid()));

create policy meeting_participants_read_authorized on public.meeting_participants for select to authenticated
using (
  public.is_active_member()
  and exists (select 1 from public.meetings m where m.id = meeting_id and (m.status = 'FINAL' or m.owner_id = auth.uid()))
);

create policy meeting_items_read_authorized on public.meeting_items for select to authenticated
using (
  public.is_active_member()
  and exists (select 1 from public.meetings m where m.id = meeting_id and (m.status = 'FINAL' or m.owner_id = auth.uid()))
);

create policy actions_read_active_members on public.actions for select to authenticated
using (public.is_active_member());

create policy action_updates_read_active_members on public.action_updates for select to authenticated
using (public.is_active_member());

revoke all on public.profiles, public.meetings, public.meeting_participants,
  public.meeting_items, public.actions, public.action_updates from anon;
revoke insert, update, delete on public.profiles, public.meetings, public.meeting_participants,
  public.meeting_items, public.actions, public.action_updates from authenticated;
