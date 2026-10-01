-- Search on the public site: one lowercase, accent-free text per published event, so "cafe"
-- finds "Café" and "kigali" finds "Kigali". The site folds what visitors type the same way.

create extension if not exists unaccent with schema extensions;

-- The two-argument form names its dictionary, so it works whatever the caller's search path.
create or replace view public.published_events
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
  ) as tiers,
  lower(extensions.unaccent(
    'extensions.unaccent'::regdictionary,
    concat_ws(' ', e.title, v.name, v.city, v.country, o.display_name)
  )) as search_text
from public.events e
join public.venues v on v.id = e.venue_id
join public.organisers o on o.id = e.organiser_id
where e.status = 'published';

revoke all on public.published_events from anon, authenticated;
grant select on public.published_events to anon;
