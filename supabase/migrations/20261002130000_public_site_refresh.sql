-- The public site serves event pages from its cache. When a change touches a published event
-- (publishing, unpublishing, an edit, a deletion), the database tells the public site at once,
-- so an unpublished event never lingers. Tier, venue and organiser changes already touch their
-- events, so this one trigger on events hears them all. The apps never call each other.
--
-- Where to call and the shared secret live in Supabase Vault, set once per environment and never
-- in this repository:
--   select vault.create_secret('https://<public site>/api/revalidate', 'public_site_refresh_url');
--   select vault.create_secret('<random secret>', 'public_site_refresh_secret');
-- Without them (a fresh local stack), nothing is sent.

create extension if not exists pg_net with schema extensions;

-- Runs with its owner's rights to read the two secrets; it lives in `private`, which the API does
-- not expose, and sends only what kind of change happened and the event's public id.
create function private.tell_public_site()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  touched_public boolean :=
    (tg_op <> 'INSERT' and old.status = 'published')
    or (tg_op <> 'DELETE' and new.status = 'published');
  refresh_url text;
  refresh_secret text;
begin
  -- A draft that stays a draft changes nothing anyone outside can see.
  if not touched_public then
    return null;
  end if;

  select decrypted_secret into refresh_url
    from vault.decrypted_secrets where name = 'public_site_refresh_url';
  select decrypted_secret into refresh_secret
    from vault.decrypted_secrets where name = 'public_site_refresh_secret';
  if refresh_url is null or refresh_secret is null then
    return null;
  end if;

  -- Queued, and sent by pg_net only once this transaction commits: a refused save sends nothing.
  perform net.http_post(
    url := refresh_url,
    body := jsonb_build_object(
      'type', tg_op,
      'public_id', coalesce(new.public_id, old.public_id)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Revalidate-Secret', refresh_secret
    ),
    timeout_milliseconds := 5000
  );
  return null;
end;
$$;

revoke all on function private.tell_public_site() from public, anon, authenticated;

create trigger events_tell_public_site
  after insert or update or delete on public.events
  for each row execute function private.tell_public_site();
