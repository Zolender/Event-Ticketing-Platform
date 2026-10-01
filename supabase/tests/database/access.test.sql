-- Who sees what, tested as the real roles: anonymous visitors and a signed-in organiser.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Organiser A: one published event (with a tier) and one draft. Organiser B: one draft.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local', '{"display_name": "Organiser A"}'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local', '{"display_name": "Organiser B"}');
insert into public.venues (id, organiser_id, name, address, city, country, timezone) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000',
   'Arena', 'KG 17 Ave', 'Kigali', 'Rwanda', 'Africa/Kigali'),
  ('b0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000000',
   'Hall', 'KN 3 Rd', 'Kigali', 'Rwanda', 'Africa/Kigali');
insert into public.events (id, organiser_id, venue_id, title, slug, description, starts_at, currency) values
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'A published', 'a-published', 'Desc',
   now() + interval '10 days', 'RWF'),
  ('a2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'A draft', 'a-draft', null,
   now() + interval '12 days', 'RWF'),
  ('b1000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000',
   'b0000000-0000-0000-0000-00000000000b', 'B draft', 'b-draft', null,
   now() + interval '15 days', 'RWF');
insert into public.ticket_tiers (event_id, name, price, capacity) values
  ('a1000000-0000-0000-0000-000000000001', 'Regular', 10000, 200);
update public.events set status = 'published' where id = 'a1000000-0000-0000-0000-000000000001';

-- Anonymous visitors: no table, only the view, which shows published events and public columns.
set local role anon;

select throws_ok($$ select * from public.events $$, '42501', null,
  'anonymous visitors cannot read events');
select throws_ok($$ select * from public.venues $$, '42501', null,
  'anonymous visitors cannot read venues');
select throws_ok($$ select * from public.ticket_tiers $$, '42501', null,
  'anonymous visitors cannot read ticket tiers');
select throws_ok(
  $$ insert into public.events (organiser_id, venue_id, title, slug, starts_at, currency)
     values ('aaaaaaaa-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000000a',
             'x', 'x', now() + interval '1 day', 'RWF') $$,
  '42501', null, 'anonymous visitors cannot create events');
select results_eq(
  $$ select title from public.published_events
     where organiser_name in ('Organiser A', 'Organiser B') $$,
  $$ values ('A published') $$,
  'the view shows published events only, never drafts');
select hasnt_column('public', 'published_events', 'organiser_id',
  'the view does not expose who owns an event');

reset role;

-- Organiser A, signed in.
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select results_eq($$ select title from public.events order by title $$,
  $$ values ('A draft'), ('A published') $$,
  'an organiser sees only their own events');
select results_eq($$ select display_name from public.organisers $$, $$ values ('Organiser A') $$,
  'an organiser sees only their own organiser row');
select results_eq(
  $$ with changed as (
       update public.events set title = 'hijacked'
       where id = 'b1000000-0000-0000-0000-000000000001' returning 1)
     select count(*)::int from changed $$,
  $$ values (0) $$, 'an organiser cannot change another organiser''s event');
select results_eq(
  $$ with removed as (
       delete from public.events where id = 'b1000000-0000-0000-0000-000000000001' returning 1)
     select count(*)::int from removed $$,
  $$ values (0) $$, 'an organiser cannot delete another organiser''s event');
select throws_ok(
  $$ insert into public.events (organiser_id, venue_id, title, slug, starts_at, currency)
     values ('bbbbbbbb-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-00000000000b',
             'Fake', 'fake', now() + interval '3 days', 'RWF') $$,
  '42501', null, 'an organiser cannot create an event in another organiser''s name');
select throws_ok(
  $$ insert into public.ticket_tiers (event_id, name, price, capacity)
     values ('b1000000-0000-0000-0000-000000000001', 'Sneaky', 1, 1) $$,
  '42501', null, 'an organiser cannot add tiers to another organiser''s event');
select results_eq(
  $$ with removed as (
       delete from public.events where id = 'a1000000-0000-0000-0000-000000000001' returning 1)
     select count(*)::int from removed $$,
  $$ values (0) $$, 'a once-published event cannot be deleted, only unpublished');
select results_eq(
  $$ with removed as (
       delete from public.events where id = 'a2000000-0000-0000-0000-000000000002' returning 1)
     select count(*)::int from removed $$,
  $$ values (1) $$, 'an organiser can delete their own never-published draft');
select throws_ok($$ select * from public.published_events $$, '42501', null,
  'the public view is for anonymous visitors only');

reset role;

select * from finish();
rollback;
