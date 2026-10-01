-- What may happen: publishing rules, fields that never change, and keeping events fresh.

-- Every new auth user gets its organiser row; the name comes from the sign-up metadata.
create function private.create_organiser_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organisers (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Organiser')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.create_organiser_for_new_user();

create function private.enforce_event_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  publishing boolean :=
    new.status = 'published' and (tg_op = 'INSERT' or old.status = 'draft');
begin
  if tg_op = 'UPDATE' then
    if new.public_id <> old.public_id then
      raise exception 'public_id cannot change' using errcode = 'check_violation';
    end if;
    if new.organiser_id <> old.organiser_id then
      raise exception 'organiser_id cannot change' using errcode = 'check_violation';
    end if;
  end if;

  -- Set once, on first publish, then kept whatever a request sends.
  if tg_op = 'UPDATE' and old.first_published_at is not null then
    new.first_published_at := old.first_published_at;
  elsif publishing then
    new.first_published_at := now();
  else
    new.first_published_at := null;
  end if;

  if new.status = 'published' then
    if new.description is null or trim(new.description) = '' then
      raise exception 'a published event needs a description' using errcode = 'check_violation';
    end if;
    -- Checked when publishing or moving the date, so a past event can still be corrected.
    if (publishing or new.starts_at <> old.starts_at) and new.starts_at <= now() then
      raise exception 'a published event needs a future date' using errcode = 'check_violation';
    end if;
    if publishing and not exists (
      select 1 from public.ticket_tiers where event_id = new.id
    ) then
      raise exception 'a published event needs at least one ticket tier'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger events_enforce_rules before insert or update on public.events
  for each row execute function private.enforce_event_rules();

-- A published event keeps at least one tier. When the event itself is being deleted, its row is
-- already gone here, so the cascade passes.
create function private.keep_last_tier_of_published_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.events where id = old.event_id and status = 'published'
  ) and not exists (
    select 1 from public.ticket_tiers where event_id = old.event_id and id <> old.id
  ) then
    raise exception 'a published event needs at least one ticket tier'
      using errcode = 'check_violation';
  end if;
  return old;
end;
$$;

create trigger ticket_tiers_keep_last before delete on public.ticket_tiers
  for each row execute function private.keep_last_tier_of_published_event();

-- A tier or venue change also changes the event's public page: touch the event so its
-- updated_at moves and the one webhook on events sees it.
create function private.touch_event_of_tier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.events set updated_at = now()
  where id = coalesce(new.event_id, old.event_id);
  return null;
end;
$$;

create trigger ticket_tiers_touch_event after insert or update or delete on public.ticket_tiers
  for each row execute function private.touch_event_of_tier();

create function private.touch_events_of_venue()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.events set updated_at = now() where venue_id = new.id;
  return null;
end;
$$;

create trigger venues_touch_events after update on public.venues
  for each row execute function private.touch_events_of_venue();
