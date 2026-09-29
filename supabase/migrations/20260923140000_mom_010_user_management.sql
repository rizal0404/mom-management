-- MOM-010: administrator-managed accounts. Auth credentials remain in auth.users;
-- public.profiles contains only the application identity and access state.

create type public.user_admin_event as enum ('USER_CREATED', 'USER_UPDATED');

create table public.user_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  target_profile_id uuid not null references public.profiles (id) on delete restrict,
  event public.user_admin_event not null,
  before_values jsonb not null default '{}'::jsonb check (jsonb_typeof(before_values) = 'object'),
  after_values jsonb not null default '{}'::jsonb check (jsonb_typeof(after_values) = 'object'),
  created_at timestamptz not null default now()
);

create index user_admin_audit_target_created_at_idx on public.user_admin_audit (target_profile_id, created_at desc);

alter table public.user_admin_audit enable row level security;
revoke all on public.user_admin_audit from public, anon, authenticated;

create function public.admin_create_profile(
  p_actor_id uuid,
  p_profile_id uuid,
  p_display_name text,
  p_role public.profile_role
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  insert into public.profiles (id, display_name, role, is_active)
  values (p_profile_id, btrim(p_display_name), p_role, true)
  returning * into v_profile;

  insert into public.user_admin_audit (actor_id, target_profile_id, event, after_values)
  values (
    p_actor_id,
    v_profile.id,
    'USER_CREATED',
    jsonb_build_object('display_name', v_profile.display_name, 'role', v_profile.role, 'is_active', v_profile.is_active)
  );

  return v_profile;
end;
$$;

create function public.admin_update_profile(
  p_actor_id uuid,
  p_profile_id uuid,
  p_display_name text,
  p_role public.profile_role,
  p_is_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.profiles;
  v_after public.profiles;
begin
  select * into v_before from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  update public.profiles
  set display_name = btrim(p_display_name), role = p_role, is_active = p_is_active
  where id = p_profile_id
  returning * into v_after;

  if row(v_before.display_name, v_before.role, v_before.is_active)
     is distinct from row(v_after.display_name, v_after.role, v_after.is_active) then
    insert into public.user_admin_audit (actor_id, target_profile_id, event, before_values, after_values)
    values (
      p_actor_id,
      v_after.id,
      'USER_UPDATED',
      jsonb_build_object('display_name', v_before.display_name, 'role', v_before.role, 'is_active', v_before.is_active),
      jsonb_build_object('display_name', v_after.display_name, 'role', v_after.role, 'is_active', v_after.is_active)
    );
  end if;

  return v_after;
end;
$$;

revoke all on function public.admin_create_profile(uuid, uuid, text, public.profile_role) from public, anon, authenticated;
revoke all on function public.admin_update_profile(uuid, uuid, text, public.profile_role, boolean) from public, anon, authenticated;
