-- The database tells the public site about changes to published events, and only those. Requests
-- are only queued here: the transaction rolls back, so nothing is ever sent.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email, raw_user_meta_data) values
  ('dddddddd-0000-0000-0000-000000000000', 'd@test.local', '{"display_name": "Organiser D"}');
insert into public.venues (id, organiser_id, name, address, city, country, timezone) values
  ('d0000000-0000-0000-0000-00000000000d', 'dddddddd-0000-0000-0000-000000000000',
   'Hall', 'KN 1 Rd', 'Kigali', 'Rwanda', 'Africa/Kigali');
insert into public.events (id, organiser_id, venue_id, title, slug, description, starts_at, currency) values
  ('d1000000-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000000',
   'd0000000-0000-0000-0000-00000000000d', 'Quiet', 'quiet', 'Desc', now() + interval '9 days', 'RWF');
insert into public.ticket_tiers (event_id, name, price, capacity) values
  ('d1000000-0000-0000-0000-000000000001', 'Regular', 5000, 50);

create temporary table queued as select count(*) as n from net.http_request_queue;
create function pg_temp.sent() returns bigint language sql as
  $$ select count(*) - (select n from queued) from net.http_request_queue $$;

-- No secrets in Vault yet: even publishing sends nothing.
update public.events set status = 'published' where id = 'd1000000-0000-0000-0000-000000000001';
select is(pg_temp.sent(), 0::bigint, 'without the Vault secrets nothing is sent');
update public.events set status = 'draft' where id = 'd1000000-0000-0000-0000-000000000001';

select vault.create_secret('http://public.test/api/revalidate', 'public_site_refresh_url');
select vault.create_secret('test-secret', 'public_site_refresh_secret');

update public.events set title = 'Still quiet' where id = 'd1000000-0000-0000-0000-000000000001';
select is(pg_temp.sent(), 0::bigint, 'editing a draft tells nobody');

-- Changes are made as the organiser, as the organiser app does; checks read the queue as the owner.
create function pg_temp.as_organiser(change text) returns void language plpgsql as $f$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    '{"sub": "dddddddd-0000-0000-0000-000000000000", "role": "authenticated"}', true);
  execute change;
  reset role;
end;
$f$;

select pg_temp.as_organiser($$ update public.events set status = 'published' where id = 'd1000000-0000-0000-0000-000000000001' $$);
select is(pg_temp.sent(), 1::bigint, 'publishing tells the public site');
select is(
  (select url from net.http_request_queue order by id desc limit 1),
  'http://public.test/api/revalidate',
  'the request goes to the address kept in Vault'
);
select is(
  (select headers->>'X-Revalidate-Secret' from net.http_request_queue order by id desc limit 1),
  'test-secret',
  'the request carries the shared secret'
);
select is(
  (select convert_from(body, 'utf8')::jsonb from net.http_request_queue order by id desc limit 1),
  jsonb_build_object('type', 'UPDATE', 'public_id',
    (select public_id from public.events where id = 'd1000000-0000-0000-0000-000000000001')),
  'the body says only what kind of change and which event'
);

select pg_temp.as_organiser($$ update public.events set title = 'Loud' where id = 'd1000000-0000-0000-0000-000000000001' $$);
select is(pg_temp.sent(), 2::bigint, 'editing a published event tells the public site');

select pg_temp.as_organiser($$ update public.ticket_tiers set price = 6000 where event_id = 'd1000000-0000-0000-0000-000000000001' $$);
select is(pg_temp.sent(), 3::bigint, 'a tier change reaches it too, through its event');

select pg_temp.as_organiser($$ update public.events set status = 'draft' where id = 'd1000000-0000-0000-0000-000000000001' $$);
select is(pg_temp.sent(), 4::bigint, 'unpublishing tells the public site');

set local role authenticated;
set local request.jwt.claims to '{"sub": "dddddddd-0000-0000-0000-000000000000", "role": "authenticated"}';
select throws_ok(
  $$ select private.tell_public_site() $$,
  '42501', null,
  'organisers cannot call the function themselves'
);
select throws_ok(
  $$ select count(*) from vault.decrypted_secrets $$,
  '42501', null,
  'organisers cannot read the secrets'
);

select * from finish();
rollback;
