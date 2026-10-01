-- Who sees what. Organisers reach only their own rows; anonymous visitors reach only the view
-- of published events.

-- Supabase grants every role broad rights on new tables; anonymous visitors get none.
revoke all on public.organisers, public.venues, public.events, public.ticket_tiers from anon;

alter table public.organisers enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.ticket_tiers enable row level security;

-- Rows are created by the sign-up trigger, so organisers can only read and rename themselves.
create policy "organisers read themselves" on public.organisers
  for select to authenticated using (id = (select auth.uid()));
create policy "organisers rename themselves" on public.organisers
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "organisers read their venues" on public.venues
  for select to authenticated using (organiser_id = (select auth.uid()));
create policy "organisers add their venues" on public.venues
  for insert to authenticated with check (organiser_id = (select auth.uid()));
create policy "organisers edit their venues" on public.venues
  for update to authenticated
  using (organiser_id = (select auth.uid())) with check (organiser_id = (select auth.uid()));
create policy "organisers delete their venues" on public.venues
  for delete to authenticated using (organiser_id = (select auth.uid()));

create policy "organisers read their events" on public.events
  for select to authenticated using (organiser_id = (select auth.uid()));
create policy "organisers add their events" on public.events
  for insert to authenticated with check (organiser_id = (select auth.uid()));
create policy "organisers edit their events" on public.events
  for update to authenticated
  using (organiser_id = (select auth.uid())) with check (organiser_id = (select auth.uid()));
-- Once published, an event may have been shared or indexed: unpublish only, never delete.
create policy "organisers delete their never-published events" on public.events
  for delete to authenticated
  using (organiser_id = (select auth.uid()) and first_published_at is null);

create policy "organisers manage the tiers of their events" on public.ticket_tiers
  for all to authenticated
  using (exists (
    select 1 from public.events
    where events.id = ticket_tiers.event_id and events.organiser_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.events
    where events.id = ticket_tiers.event_id and events.organiser_id = (select auth.uid())
  ));

-- The only door for anonymous visitors. It runs with its owner's rights on purpose, so it can
-- read past the policies above, and it shows published events and public columns only.
create view public.published_events
with (security_invoker = false)
as
select
  e.public_id,
  e.slug,
  e.title,
  e.description,
  e.starts_at,
  e.currency,
  e.updated_at,
  v.name as venue_name,
  v.address as venue_address,
  v.city as venue_city,
  v.country as venue_country,
  v.timezone as venue_timezone,
  o.display_name as organiser_name,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('name', t.name, 'price', t.price, 'capacity', t.capacity)
        order by t.position, t.id
      )
      from public.ticket_tiers t
      where t.event_id = e.id
    ),
    '[]'::jsonb
  ) as tiers
from public.events e
join public.venues v on v.id = e.venue_id
join public.organisers o on o.id = e.organiser_id
where e.status = 'published';

revoke all on public.published_events from anon, authenticated;
grant select on public.published_events to anon;
