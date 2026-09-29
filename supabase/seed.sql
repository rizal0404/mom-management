-- DATA DEMO only. IDs remain stable so DB integration tests can authenticate
-- against the local Supabase Auth instance without exposing any real account.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin.demo@mom.local', '$2b$10$XyBdlwJ5j6bRGLhb2RZ9h.UqqU4SciFfZnYRCq2doPNrj8I8IJOkm', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '', false, false),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anggota-a.demo@mom.local', '$2b$10$XyBdlwJ5j6bRGLhb2RZ9h.UqqU4SciFfZnYRCq2doPNrj8I8IJOkm', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '', false, false),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anggota-b.demo@mom.local', '$2b$10$XyBdlwJ5j6bRGLhb2RZ9h.UqqU4SciFfZnYRCq2doPNrj8I8IJOkm', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '', false, false),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nonaktif.demo@mom.local', '$2b$10$XyBdlwJ5j6bRGLhb2RZ9h.UqqU4SciFfZnYRCq2doPNrj8I8IJOkm', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '', false, false);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select id, id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users where email like '%.demo@mom.local';

insert into public.profiles (id, display_name, role, is_active) values
  ('11111111-1111-1111-1111-111111111111', 'Admin DATA DEMO', 'ADMIN', true),
  ('22222222-2222-2222-2222-222222222222', 'Anggota A DATA DEMO', 'MEMBER', true),
  ('33333333-3333-3333-3333-333333333333', 'Anggota B DATA DEMO', 'MEMBER', true),
  ('44444444-4444-4444-4444-444444444444', 'Nonaktif DATA DEMO', 'MEMBER', false);

insert into public.meetings (id, title, starts_at, chair_name, owner_id, status, finalized_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Draf privat A — DATA DEMO', '2026-09-21 01:00:00+00', 'Ketua DATA DEMO', '22222222-2222-2222-2222-222222222222', 'DRAFT', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Draf privat B — DATA DEMO', '2026-09-21 02:00:00+00', 'Ketua DATA DEMO', '33333333-3333-3333-3333-333333333333', 'DRAFT', null),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Notula final bersama — DATA DEMO', '2026-09-21 03:00:00+00', 'Ketua DATA DEMO', '22222222-2222-2222-2222-222222222222', 'FINAL', now());

insert into public.meeting_participants (meeting_id, profile_id, display_name_snapshot) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Anggota A DATA DEMO'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Anggota B DATA DEMO'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Anggota A DATA DEMO');
