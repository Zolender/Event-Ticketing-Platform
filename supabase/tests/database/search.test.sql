-- Search text on the public view, read as an anonymous visitor.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local', '{"display_name": "Søren Œuvres"}');
insert into public.venues (id, organiser_id, name, address, city, country, timezone) values
  ('c0000000-0000-0000-0000-00000000000c', 'cccccccc-0000-0000-0000-000000000000',
   'Théâtre Élysée', 'Rue 1', 'Montréal', 'Canada', 'America/Toronto');
insert into public.events (id, organiser_id, venue_id, title, slug, description, starts_at, currency) values
  ('c1000000-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000000',
   'c0000000-0000-0000-0000-00000000000c', 'Café Noël: 100% Jazz', 'cafe-noel-100-jazz',
   'Only in the description: zebra', now() + interval '10 days', 'CAD'),
  ('c2000000-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000000',
   'c0000000-0000-0000-0000-00000000000c', 'Hidden draft', 'hidden-draft', null,
   now() + interval '12 days', 'CAD');
insert into public.ticket_tiers (event_id, name, price, capacity) values
  ('c1000000-0000-0000-0000-000000000001', 'Regular', 2500, 50);
update public.events set status = 'published' where id = 'c1000000-0000-0000-0000-000000000001';

set local role anon;

select is(
  (select search_text from public.published_events where slug = 'cafe-noel-100-jazz'),
  'cafe noel: 100% jazz theatre elysee montreal canada soren oeuvres',
  'the search text is lowercase and accent-free: title, venue, city, country, organiser'
);
select ok(
  exists (select 1 from public.published_events where search_text like '%cafe noel%'),
  'a search typed without accents finds the accented title'
);
select ok(
  exists (select 1 from public.published_events where search_text like '%montreal%'),
  'the venue city is searchable'
);
select ok(
  exists (select 1 from public.published_events where search_text like '%soren%'),
  'the organiser name is searchable, letters like ø folded too'
);
select ok(
  not exists (select 1 from public.published_events where search_text like '%zebra%'),
  'the description is not part of the search'
);
select ok(
  not exists (select 1 from public.published_events where search_text like '%hidden draft%'),
  'drafts stay out of the view, search included'
);
select ok(
  exists (select 1 from public.published_events where search_text like '%100\% jazz%'),
  'a percent sign can be searched literally when escaped'
);

select * from finish();
rollback;
