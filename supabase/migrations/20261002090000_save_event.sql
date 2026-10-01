-- Saving an event with its tiers, and a venue made in the same form, as one transaction. It runs
-- as the signed-in organiser (security invoker), so the policies in the access migration apply.

-- Without p_event_id it creates; with p_new_venue instead of p_venue_id it makes the venue too.
create function public.save_event(
  p_title text,
  p_slug text,
  p_starts_at timestamptz,
  p_currency text,
  p_tiers jsonb,
  p_event_id uuid default null,
  p_venue_id uuid default null,
  p_new_venue jsonb default null,
  p_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  organiser uuid := (select auth.uid());
  venue uuid := p_venue_id;
  saved uuid := p_event_id;
  tier jsonb;
  tier_id uuid;
  kept uuid[] := '{}';
  place integer := 0;
begin
  if organiser is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  if p_new_venue is not null then
    insert into public.venues (organiser_id, name, address, city, country, timezone)
    values (
      organiser,
      p_new_venue ->> 'name',
      p_new_venue ->> 'address',
      p_new_venue ->> 'city',
      p_new_venue ->> 'country',
      p_new_venue ->> 'timezone'
    )
    returning id into venue;
  end if;

  if saved is null then
    insert into public.events
      (organiser_id, venue_id, title, slug, description, starts_at, currency)
    values (organiser, venue, p_title, p_slug, p_description, p_starts_at, p_currency)
    returning id into saved;
  else
    update public.events
    set venue_id = venue, title = p_title, slug = p_slug, description = p_description,
        starts_at = p_starts_at, currency = p_currency
    where id = saved and organiser_id = organiser;
    if not found then
      raise exception 'event not found' using errcode = 'P0002';
    end if;
  end if;

  -- Tiers in the order given: known ids are updated, the rest inserted, missing ones deleted
  -- last, so a published event never passes through having none.
  for tier in select value from jsonb_array_elements(coalesce(p_tiers, '[]'::jsonb)) loop
    tier_id := nullif(tier ->> 'id', '')::uuid;
    if tier_id is not null then
      update public.ticket_tiers
      set name = tier ->> 'name', price = (tier ->> 'price')::integer,
          capacity = (tier ->> 'capacity')::integer, position = place
      where id = tier_id and event_id = saved;
      if not found then
        tier_id := null;
      end if;
    end if;
    if tier_id is null then
      insert into public.ticket_tiers (event_id, name, price, capacity, position)
      values (saved, tier ->> 'name', (tier ->> 'price')::integer,
              (tier ->> 'capacity')::integer, place)
      returning id into tier_id;
    end if;
    kept := kept || tier_id;
    place := place + 1;
  end loop;

  delete from public.ticket_tiers where event_id = saved and id <> all (kept);

  return saved;
end;
$$;

-- Functions are executable by everyone by default; this one is for signed-in organisers only.
revoke execute on function public.save_event from public, anon;
grant execute on function public.save_event to authenticated;
