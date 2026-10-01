-- A venue edit that changes its timezone also moves its events' instants, so their wall-clock
-- times stay as typed. Runs as the signed-in organiser (security invoker).

-- A wall-clock time in a zone, as an instant. Null when that time does not exist there (the
-- spring-forward gap). When it exists twice (the autumn overlap), the first occurrence wins.
-- Postgres alone would shift a gap silently and pick the later occurrence, so both candidates
-- are worked out from the offsets a day either side and checked.
create function private.local_to_utc(wall timestamp, tz text)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select min(candidate)
  from (
    select (wall at time zone 'UTC')
      - ((probe at time zone tz) - (probe at time zone 'UTC')) as candidate
    from unnest(array[
      (wall at time zone 'UTC') - interval '1 day',
      (wall at time zone 'UTC') + interval '1 day'
    ]) as probe
  ) as candidates
  where (candidate at time zone tz) = wall;
$$;

-- Events that have not started keep their wall-clock time when the venue's zone changes ("19:30"
-- stays 19:30, now in the new zone). Started ones keep their instant: they are history, and the
-- publishing rules would refuse moving them anyway.
create function public.update_venue(
  p_venue_id uuid,
  p_name text,
  p_address text,
  p_city text,
  p_country text,
  p_timezone text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_timezone text;
begin
  select timezone into old_timezone
  from public.venues
  where id = p_venue_id and organiser_id = (select auth.uid())
  for update;
  if not found then
    raise exception 'venue not found' using errcode = 'P0002';
  end if;

  update public.venues
  set name = p_name, address = p_address, city = p_city, country = p_country,
      timezone = p_timezone
  where id = p_venue_id;

  if old_timezone <> p_timezone then
    if exists (
      select 1 from public.events
      where venue_id = p_venue_id and starts_at > now()
        and private.local_to_utc(starts_at at time zone old_timezone, p_timezone) is null
    ) then
      raise exception 'an event time does not exist in the new timezone'
        using errcode = 'check_violation';
    end if;
    update public.events
    set starts_at = private.local_to_utc(starts_at at time zone old_timezone, p_timezone)
    where venue_id = p_venue_id and starts_at > now();
  end if;
end;
$$;

-- Functions are executable by everyone by default; this one is for signed-in organisers only.
revoke execute on function public.update_venue from public, anon;
grant execute on function public.update_venue to authenticated;

-- update_venue runs as the organiser and calls the helper by name, which needs the schema. The
-- API never exposes `private` (only `public` is listed in config.toml), so this opens no door.
grant usage on schema private to authenticated;
revoke execute on function private.local_to_utc from public, anon;
grant execute on function private.local_to_utc to authenticated;
