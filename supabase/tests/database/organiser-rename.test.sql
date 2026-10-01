-- Renaming an organiser refreshes their events, and only theirs.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local', '{"display_name": "Kigali Live"}'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local', '{"display_name": "Other"}');
insert into public.venues (id, organiser_id, name, address, city, country, timezone) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000',
   'Arena', 'KG 17 Ave', 'Kigali', 'Rwanda', 'Africa/Kigali'),
  ('b0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000000',
   'Hall', 'KN 3 Rd', 'Kigali', 'Rwanda', 'Africa/Kigali');
-- One event long past (published rules must not get in the way of a rename) and one to come.
insert into public.events (id, organiser_id, venue_id, title, slug, starts_at, currency, updated_at) values
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Past', 'past', now() - interval '30 days', 'RWF', now() - interval '40 days'),
  ('a2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Soon', 'soon', now() + interval '5 days', 'RWF', now() - interval '40 days'),
  ('b1000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000',
   'b0000000-0000-0000-0000-00000000000b', 'Theirs', 'theirs', now() + interval '5 days', 'RWF', now() - interval '40 days');

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select lives_ok(
  $$ update public.organisers set display_name = 'Kigali Live Collective'
     where id = 'aaaaaaaa-0000-0000-0000-000000000000' $$,
  'an organiser renames themselves');
reset role;
select ok(
  (select bool_and(updated_at > now() - interval '1 minute') from public.events
   where organiser_id = 'aaaaaaaa-0000-0000-0000-000000000000'),
  'all their events are touched, past ones included');
select ok(
  (select updated_at < now() - interval '1 day' from public.events
   where id = 'b1000000-0000-0000-0000-000000000001'),
  'another organiser''s events are not');

-- A fresh event with an old updated_at (inserts do not run the updated_at trigger).
insert into public.events (id, organiser_id, venue_id, title, slug, starts_at, currency, updated_at) values
  ('a3000000-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Later', 'later', now() + interval '9 days', 'RWF', now() - interval '40 days');
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';
update public.organisers set display_name = 'Kigali Live Collective'
  where id = 'aaaaaaaa-0000-0000-0000-000000000000';
reset role;
select ok(
  (select updated_at < now() - interval '1 day' from public.events
   where id = 'a3000000-0000-0000-0000-000000000003'),
  'saving the same name touches nothing');

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok(
  $$ update public.organisers set display_name = '' where id = 'aaaaaaaa-0000-0000-0000-000000000000' $$,
  '23514', null, 'a name cannot be empty');
select is(
  (select count(*)::int from public.organisers where id = 'bbbbbbbb-0000-0000-0000-000000000000'
     and display_name = 'Other'),
  0, 'another organiser is not visible to rename');

select * from finish();
rollback;
