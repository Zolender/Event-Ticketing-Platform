-- A venue's timezone changes, and its events keep their wall-clock times.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local');
insert into public.venues (id, organiser_id, name, address, city, country, timezone) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000',
   'Arena', 'KG 17 Ave', 'Kigali', 'Rwanda', 'Africa/Kigali'),
  ('b0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000000',
   'Hall', 'KN 3 Rd', 'Kigali', 'Rwanda', 'Africa/Kigali');
-- On A's venue: one event at 19:30 Kigali time in the future, one that has already happened.
insert into public.events (id, organiser_id, venue_id, title, slug, starts_at, currency) values
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Future', 'future',
   private.local_to_utc((current_date + 30) + time '19:30', 'Africa/Kigali'), 'RWF'),
  ('a2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Past', 'past', now() - interval '3 days', 'RWF'),
  ('b1000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000',
   'b0000000-0000-0000-0000-00000000000b', 'B draft', 'b-draft', now() + interval '9 days', 'RWF');

-- The wall-clock helper.
select is(private.local_to_utc('2026-03-29 01:30', 'Europe/London'), null,
  'a time inside the spring-forward gap does not exist');
select is(private.local_to_utc('2026-10-25 01:30', 'Europe/London'), '2026-10-25 00:30+00'::timestamptz,
  'a time that happens twice takes its first occurrence');
select is(private.local_to_utc('2026-04-05 01:45', 'Australia/Lord_Howe'), '2026-04-04 14:45+00'::timestamptz,
  'the first occurrence also with a 30-minute shift');
select is(private.local_to_utc('2026-12-31 00:30', 'Africa/Kigali'), '2026-12-30 22:30+00'::timestamptz,
  'a time just after midnight lands on the previous UTC day');

-- Anonymous visitors cannot call it.
set local role anon;
select throws_ok(
  $$ select public.update_venue('a0000000-0000-0000-0000-00000000000a', 'X', 'X', 'X', 'X', 'Africa/Kigali') $$,
  '42501', null, 'anonymous visitors cannot update venues');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';
-- A venue's timezone changes: events to come keep their wall-clock time, started ones their instant.
select lives_ok(
  $$ select public.update_venue('a0000000-0000-0000-0000-00000000000a', 'Arena', 'KG 17 Ave',
       'Nairobi', 'Kenya', 'Africa/Nairobi') $$,
  'a venue moves to another timezone');
select is(
  (select to_char(starts_at at time zone 'Africa/Nairobi', 'HH24:MI') from public.events
   where id = 'a1000000-0000-0000-0000-000000000001'),
  '19:30', 'an event to come keeps 19:30, now in the venue''s new zone');
reset role;
select ok(
  (select starts_at between now() - interval '3 days 1 minute' and now() - interval '3 days' + interval '1 minute'
   from public.events where id = 'a2000000-0000-0000-0000-000000000002'),
  'an event that already happened keeps its instant');
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select throws_ok(
  $$ select public.update_venue('b0000000-0000-0000-0000-00000000000b', 'Mine', 'KN 3 Rd',
       'Kigali', 'Rwanda', 'Africa/Kigali') $$,
  'P0002', 'venue not found', 'another organiser''s venue cannot be updated');

-- Moving an event's time into a daylight saving gap is refused, and the venue is unchanged.
reset role;
update public.events
  set starts_at = private.local_to_utc(timestamp '2027-03-28 01:30', 'Africa/Nairobi')
  where id = 'a1000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok(
  $$ select public.update_venue('a0000000-0000-0000-0000-00000000000a', 'Arena', 'KG 17 Ave',
       'London', 'United Kingdom', 'Europe/London') $$,
  '23514', 'an event time does not exist in the new timezone',
  'a zone change that would put an event in a daylight saving gap is refused');
select is((select timezone from public.venues where id = 'a0000000-0000-0000-0000-00000000000a'),
  'Africa/Nairobi', 'and the venue keeps its zone');

select * from finish();
rollback;
