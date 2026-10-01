-- What exists: tables, constraints, indexes and their upkeep.

-- Helpers live outside `public`, which the API exposes.
create schema private;

-- 8 characters from a 32-letter alphabet without look-alikes (no 0, 1, l, o).
create function private.generate_public_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('abcdefghijkmnpqrstuvwxyz23456789', (get_byte(bytes, i) % 32) + 1, 1),
    ''
  )
  from extensions.gen_random_bytes(8) as bytes, generate_series(0, 7) as i;
$$;

create function private.is_valid_timezone(tz text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The public face of an auth user: a name, never the email.
create table public.organisers (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid not null references public.organisers (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  address text not null check (char_length(address) between 1 and 300),
  city text not null check (char_length(city) between 1 and 100),
  country text not null check (char_length(country) between 1 and 100),
  timezone text not null check (private.is_valid_timezone(timezone)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets events reference (venue, organiser) together, below.
  unique (id, organiser_id)
);

create type public.event_status as enum ('draft', 'published');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default private.generate_public_id(),
  organiser_id uuid not null references public.organisers (id) on delete cascade,
  venue_id uuid not null,
  title text not null check (char_length(title) between 1 and 200),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 5000),
  starts_at timestamptz not null,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status public.event_status not null default 'draft',
  first_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An event can only use a venue of its own organiser.
  foreign key (venue_id, organiser_id) references public.venues (id, organiser_id)
);

create table public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  -- Minor units of the event's currency.
  price integer not null check (price >= 0),
  capacity integer not null check (capacity > 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index venues_organiser_id_idx on public.venues (organiser_id);
create index events_organiser_id_idx on public.events (organiser_id);
create index events_venue_id_idx on public.events (venue_id);
-- The public list: published events by start time, then public_id (the cursor).
create index events_published_starts_at_idx on public.events (starts_at, public_id)
  where status = 'published';
create index ticket_tiers_event_id_idx on public.ticket_tiers (event_id, position);

create trigger venues_set_updated_at before update on public.venues
  for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function private.set_updated_at();
create trigger ticket_tiers_set_updated_at before update on public.ticket_tiers
  for each row execute function private.set_updated_at();
