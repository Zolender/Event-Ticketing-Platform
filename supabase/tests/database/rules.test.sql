-- What may happen: publishing rules, fields that never change, and the table constraints.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local', '{"display_name": "Kigali Live"}');
insert into auth.users (id, email) values
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local');
insert into public.venues (id, organiser_id, name, address, city, country, timezone) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000',
   'Arena', 'KG 17 Ave', 'Kigali', 'Rwanda', 'Africa/Kigali');
insert into public.events (id, organiser_id, venue_id, title, slug, description, starts_at, currency) values
  ('e0000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Jazz Night', 'jazz-night', 'Live jazz.',
   now() + interval '10 days', 'RWF'),
  ('e0000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'No description', 'no-description', null,
   now() + interval '10 days', 'RWF');
insert into public.ticket_tiers (event_id, name, price, capacity) values
  ('e0000000-0000-0000-0000-000000000002', 'Regular', 5000, 50);

select results_eq(
  $$ select display_name from public.organisers
     where id in ('aaaaaaaa-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000')
     order by display_name $$,
  $$ values ('Kigali Live'), ('Organiser') $$,
  'every new user gets an organiser row, named from its metadata or "Organiser"');
select is(
  (select first_published_at from public.events where id = 'e0000000-0000-0000-0000-000000000001'),
  null, 'a new draft has never been published');

select throws_ok(
  $$ update public.events set status = 'published' where id = 'e0000000-0000-0000-0000-000000000001' $$,
  '23514', 'a published event needs at least one ticket tier',
  'publishing without a tier is refused');
select throws_ok(
  $$ update public.events set status = 'published' where id = 'e0000000-0000-0000-0000-000000000002' $$,
  '23514', 'a published event needs a description',
  'publishing without a description is refused');

insert into public.ticket_tiers (event_id, name, price, capacity) values
  ('e0000000-0000-0000-0000-000000000001', 'Regular', 10000, 200);
select lives_ok(
  $$ update public.events set status = 'published' where id = 'e0000000-0000-0000-0000-000000000001' $$,
  'a complete event publishes');
select isnt(
  (select first_published_at from public.events where id = 'e0000000-0000-0000-0000-000000000001'),
  null, 'publishing records when it first happened');

select throws_ok(
  $$ update public.events set public_id = 'zzzzzzzz' where id = 'e0000000-0000-0000-0000-000000000001' $$,
  '23514', 'public_id cannot change', 'the public id never changes (shared links)');
select throws_ok(
  $$ update public.events set organiser_id = 'bbbbbbbb-0000-0000-0000-000000000000'
     where id = 'e0000000-0000-0000-0000-000000000001' $$,
  '23514', 'organiser_id cannot change', 'an event never changes owner');
select throws_ok(
  $$ delete from public.ticket_tiers where event_id = 'e0000000-0000-0000-0000-000000000001' $$,
  '23514', 'a published event needs at least one ticket tier',
  'the last tier of a published event cannot be deleted');
select throws_ok(
  $$ update public.events set starts_at = now() - interval '1 day'
     where id = 'e0000000-0000-0000-0000-000000000001' $$,
  '23514', 'a published event needs a future date',
  'a published event cannot be moved into the past');

update public.events set status = 'draft', first_published_at = null
  where id = 'e0000000-0000-0000-0000-000000000001';
select isnt(
  (select first_published_at from public.events where id = 'e0000000-0000-0000-0000-000000000001'),
  null, 'unpublishing keeps the record that the event was once public');

select throws_ok(
  $$ insert into public.events (organiser_id, venue_id, title, slug, starts_at, currency)
     values ('bbbbbbbb-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000000a',
             'Steal', 'steal', now() + interval '5 days', 'RWF') $$,
  '23503', null, 'an event can only use a venue of its own organiser');
select throws_ok(
  $$ insert into public.venues (organiser_id, name, address, city, country, timezone)
     values ('aaaaaaaa-0000-0000-0000-000000000000', 'Moon Base', 'Crater 1', 'Tranquility',
             'Moon', 'Mars/Base') $$,
  '23514', null, 'a venue needs a real IANA timezone');
select throws_ok(
  $$ insert into public.ticket_tiers (event_id, name, price, capacity)
     values ('e0000000-0000-0000-0000-000000000001', 'Refund', -100, 10) $$,
  '23514', null, 'a ticket price cannot be negative');

select * from finish();
rollback;
