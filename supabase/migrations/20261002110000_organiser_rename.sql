-- An organiser's name shows on every event page they published: renaming touches their events, so
-- updated_at moves and the one webhook on events refreshes the public pages, as for tiers and
-- venues. Runs as the organiser renaming themselves; the access policies let them touch only theirs.
create function private.touch_events_of_organiser()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.display_name is distinct from old.display_name then
    update public.events set updated_at = now() where organiser_id = new.id;
  end if;
  return null;
end;
$$;

create trigger organisers_touch_events after update on public.organisers
  for each row execute function private.touch_events_of_organiser();
