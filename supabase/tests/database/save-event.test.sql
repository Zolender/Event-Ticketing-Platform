-- Saving an event with its tiers in one go.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local');
insert into public.venues (id, organiser_id, name, address, city, country, timezone) values
  ('a0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000',
   'Arena', 'KG 17 Ave', 'Kigali', 'Rwanda', 'Africa/Kigali'),
  ('b0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000000',
   'Hall', 'KN 3 Rd', 'Kigali', 'Rwanda', 'Africa/Kigali');
insert into public.events (id, organiser_id, venue_id, title, slug, starts_at, currency) values
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Future', 'future',
   now() + interval '30 days', 'RWF'),
  ('a2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-00000000000a', 'Past', 'past', now() - interval '3 days', 'RWF'),
  ('b1000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000000',
   'b0000000-0000-0000-0000-00000000000b', 'B draft', 'b-draft', now() + interval '9 days', 'RWF');
insert into public.ticket_tiers (id, event_id, name, price, capacity) values
  ('b7000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'B tier', 100, 5);

-- Anonymous visitors cannot call the write functions at all.
set local role anon;
select throws_ok(
  $$ select public.save_event(p_venue_id => 'a0000000-0000-0000-0000-00000000000a', p_title => 'X',
       p_slug => 'x', p_starts_at => now() + interval '1 day', p_currency => 'RWF', p_tiers => '[]') $$,
  '42501', null, 'anonymous visitors cannot save events');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

-- Create, with a venue made inline and two tiers.
create temporary table made on commit drop as
select public.save_event(
  p_new_venue => '{"name": "Rooftop", "address": "KN 4 Ave", "city": "Kigali", "country": "Rwanda", "timezone": "Africa/Kigali"}',
  p_title => 'Rooftop Night', p_slug => 'rooftop-night', p_starts_at => now() + interval '20 days',
  p_currency => 'RWF',
  p_tiers => '[{"name": "Regular", "price": 5000, "capacity": 100}, {"name": "VIP", "price": 15000, "capacity": 20}]'
) as id;
select is((select count(*)::int from public.venues where name = 'Rooftop'), 1,
  'a venue created in the form is saved with the event');
select results_eq(
  $$ select name, position from public.ticket_tiers where event_id = (select id from made) order by position $$,
  $$ values ('Regular'::text, 0), ('VIP'::text, 1) $$,
  'tiers are saved in the order given');

-- Edit: reorder, rename, remove one, add one.
select lives_ok(
  format($$ select public.save_event(p_event_id => %L,
       p_venue_id => (select venue_id from public.events where id = %L),
       p_title => 'Rooftop Night', p_slug => 'rooftop-night', p_description => 'Live music.',
       p_starts_at => now() + interval '20 days', p_currency => 'RWF',
       p_tiers => jsonb_build_array(
         jsonb_build_object('id', (select id from public.ticket_tiers where event_id = %L and name = 'VIP'),
                            'name', 'VIP lounge', 'price', 15000, 'capacity', 20),
         jsonb_build_object('name', 'Student', 'price', 2000, 'capacity', 50))) $$,
    (select id from made), (select id from made), (select id from made)),
  'an edit with reordered, renamed, removed and new tiers saves');
select results_eq(
  $$ select name, position from public.ticket_tiers where event_id = (select id from made) order by position $$,
  $$ values ('VIP lounge'::text, 0), ('Student'::text, 1) $$,
  'the edit keeps the new order, renames, drops the removed tier and adds the new one');

-- Someone else's tier id cannot be taken over: it is treated as a new tier.
select lives_ok(
  format($$ select public.save_event(p_event_id => %L,
       p_venue_id => (select venue_id from public.events where id = %L),
       p_title => 'Rooftop Night', p_slug => 'rooftop-night', p_description => 'Live music.',
       p_starts_at => now() + interval '20 days', p_currency => 'RWF',
       p_tiers => '[{"id": "b7000000-0000-0000-0000-000000000001", "name": "Mine now", "price": 1, "capacity": 1}]') $$,
    (select id from made), (select id from made)),
  'a save naming a tier of another event does not fail');
reset role;
select is((select name from public.ticket_tiers where id = 'b7000000-0000-0000-0000-000000000001'), 'B tier',
  'the other organiser''s tier is untouched');
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated"}';

select throws_ok(
  $$ select public.save_event(p_event_id => 'b1000000-0000-0000-0000-000000000001',
       p_venue_id => 'a0000000-0000-0000-0000-00000000000a', p_title => 'Taken', p_slug => 'taken',
       p_starts_at => now() + interval '9 days', p_currency => 'RWF', p_tiers => '[]') $$,
  'P0002', 'event not found', 'another organiser''s event cannot be saved over');

-- All or nothing: a failing event leaves no venue behind; a failing edit changes nothing.
select throws_ok(
  $$ select public.save_event(
       p_new_venue => '{"name": "Ghost", "address": "Nowhere", "city": "Kigali", "country": "Rwanda", "timezone": "Africa/Kigali"}',
       p_title => '', p_slug => 'x', p_starts_at => now() + interval '5 days', p_currency => 'RWF',
       p_tiers => '[]') $$,
  '23514', null, 'an invalid event is refused');
select is((select count(*)::int from public.venues where name = 'Ghost'), 0,
  'and the venue created with it is not kept');

update public.events set status = 'published' where id = (select id from made);
select throws_ok(
  format($$ select public.save_event(p_event_id => %L,
       p_venue_id => (select venue_id from public.events where id = %L),
       p_title => 'Renamed', p_slug => 'renamed', p_description => 'Live music.',
       p_starts_at => now() + interval '20 days', p_currency => 'RWF', p_tiers => '[]') $$,
    (select id from made), (select id from made)),
  '23514', 'a published event needs at least one ticket tier',
  'saving a published event without tiers is refused');
select is((select title from public.events where id = (select id from made)), 'Rooftop Night',
  'and nothing of that save is kept');

select * from finish();
rollback;
