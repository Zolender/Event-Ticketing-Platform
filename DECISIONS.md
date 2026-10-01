# Decisions

Written as the project goes. Some choices were made before building started, others during
construction; each section says which. Where I weighed options, the ones I did not take are named.

## Shape of the repository (before building)

- **Two independent apps side by side**: `events-public/` and `events-organiser/`, each with its
  own `package.json`, lockfile and build. Nothing is shared between them, so a few things exist
  twice (types, the date formatter, the event layout used for previews). That duplication is the
  price of independence and I accept it. No `apps/` parent folder: it is the monorepo convention,
  which this brief rules out.
- **The database lives in a root `supabase/` folder** (migrations, access policies, seed, tests).
  It is not code either app imports; it describes the one database both apps depend on, and the
  root shows that dependency honestly. I considered keeping it inside the organiser app (hides the
  public app's dependency) and one schema per app (two databases would need syncing; one database
  split in two still ties the view to the tables). Independence comes from narrow contracts
  instead: the public app reads only a view of published events; the organiser app reaches the
  tables only through access policies, as the signed-in user; each app generates its own types.
- **No dedicated backend for now.** A NestJS API was tempting (one home for business rules, a
  contract for future clients), but the backend is not assessed, it would be a third deployable
  against "two Vercel projects", and every extra hop is one more place to get access control
  wrong. Each app has a single data access layer that talks to Supabase, so switching to an API
  later changes that layer only.
- During construction: code sits in `src/` in both apps, apart from config files. Each app keeps a
  `pnpm-workspace.yaml`: pnpm (10 and later) stores project settings there even for a single
  package. Here it only refuses build scripts from two dependencies; it declares no packages, so
  it is not a workspace. TypeScript is the version `create-next-app` ships.

## Data and access control (before building)

- **Supabase** (Postgres, Auth, row-level security). A hosted database because two Vercel projects
  cannot share or write a SQLite file. Organiser accounts are seeded; sign-up is closed.
- **The domain**: a venue is its own record and owns the IANA timezone; event times are stored as
  UTC instants and always displayed in the venue's zone; prices are integers in minor units with a
  currency per event. Venue and date are required from the first save, because a time means
  nothing without its zone. Publishing requires a title, description, venue, future date and at
  least one tier. An event can be deleted only if it was never published; after that it can only
  be unpublished, since it may have been shared or indexed.
- **The organiser app is private, in three layers.** `proxy.ts` redirects signed-out visitors, but
  it is comfort, not security (CVE-2025-29927 showed middleware can be skipped). The real check is
  in a server-only data access layer that every route handler goes through, using a verified user.
  The database's policies are the last line: an organiser's rows only. Another organiser's event
  answers 404, exactly like a missing one.
- **The browser never talks to Supabase directly**, in either app: it calls our route handlers,
  which validate input and query Supabase as the signed-in user. Neither app holds the service key,
  so the policies cannot be bypassed from our code. Writes are protected against cross-site
  requests by SameSite cookies, an Origin check and JSON-only bodies.
- **Drafts are unreachable**: anonymous visitors can read only a `published_events` view, which
  hides draft rows and private columns even from someone using the public key directly. Public
  pages are refreshed by a database webhook when an event changes, so an unpublished event does
  not linger in a cache, and the two apps never call each other. Draft previews live inside the
  organiser app, never behind a secret public link.
- During construction: the publishing rules are also enforced by database triggers, so a bug in
  our server still cannot publish an incomplete event; the public id and the owner of an event
  never change, and the date it was first published cannot be forged or erased. The
  `published_events` view deliberately runs with its owner's rights (Supabase flags it as a
  "security definer view"): that is what lets it be the one narrow door, showing published rows
  and public columns only. The alternative, letting anonymous visitors read published rows of the
  tables through policies, would expose every column of those rows. These guarantees are proven by
  pgTAP tests in `supabase/tests` (`supabase test db`), run as the real roles.
- During construction: signing in goes through our own route handler, so the session cookie can
  be `httpOnly` (nothing in the browser needs to read it, so a script injected by an XSS bug could
  never steal it), `SameSite=Lax` and `Secure` in production. `proxy.ts` checks the session with
  `getClaims()` (a fast local signature check); pages and route handlers use `getUser()`, which asks
  Supabase Auth every time, so a revoked session is refused at once. The cross-site guard (Origin
  check, JSON only) was written with this first write handler rather than later, because sign-in
  has its own forgery attack: signing a victim into the attacker's account. A wrong password and
  an unknown email get the same answer, so the form never reveals who has an account.

## The public site (before building)

- Server-rendered pages. The event detail page uses no client data fetching at all.
- Event URLs combine a readable slug and a short random id (`/events/kigali-jazz-night-8f3k2a9b`);
  the id finds the event and an outdated slug redirects to the current one.
- Metadata per event, a generated preview image, JSON-LD `Event` data (escaped, since descriptions
  are organiser input), a sitemap and robots file. Past events stay reachable as "ended" but leave
  the sitemap and search results.
- Times show in the venue's zone, plus the visitor's own time added after hydration.

## The public site (during construction)

- Event pages are made on their first visit and then served from the cache (static regeneration),
  with a five-minute limit so an event that starts shows as ended without anyone editing it; the
  database webhook will expire a page the moment its event changes. I looked at Next 16's new
  Cache Components first, but they stream a page shell before the event is looked up, so the
  status is already 200: a draft would get a "soft" 404 and an old slug a redirect done in the
  browser. Drafts must answer a real 404, and crawlers read status codes. Rendering fresh on every
  request stays the fallback.
- One rule for an event's address, applied before anything renders: no such published event (a
  draft too) is a 404, an id that cannot exist never reaches the database, the exact canonical
  address is the page, and any other address for the event (an old slug, capitals, a bare id for
  posters) is a 308 to it.
- The page draws the event as a ticket, its date on a navy stub, and the same ticket is the
  preview image a shared link shows. The countdown and the visitor's own time are added in the
  browser, so cached pages never carry stale text. The year is always shown here (the organiser
  app hides the current one): an ended page can stay cached for a long time.
- The structured data lists one offer per tier without availability: nothing is sold here and no
  sales are tracked, so claiming stock would be untrue. Google's test shows a warning for it, not
  an error.
- The list groups events by month and loads twelve more at a time by cursor (start time, then
  public id for events that start together), asking for one extra row to know whether more exist.
  Page numbers would skip or repeat events while organisers publish.
- Search waits for a 500 ms pause (people type slowly) and two characters, keeps the previous
  results on screen while the next load, and replaces the URL rather than adding to history, so a
  search can be shared and Back leaves the page. It matches an accent-free text the database
  builds for each published event (title, venue, city, country, organiser), so "cafe" finds
  "Café". Full-text search with ranking is kept for when there are enough events to rank. Search
  result pages are not indexed; the list itself is.
- The home page shows a section only when it has something in it, so one event or none still
  looks intended. The organiser app links a live event to its public page; the apps still never
  call each other.

## Data and state (before building)

- TanStack Query where server state changes under the user: the organiser app (server prefetch,
  hydration, mutations, invalidation) and the public list (load more by cursor, search kept in the
  URL). One data access function serves both the server prefetch and the route handler.
- Publishing waits for the server rather than updating optimistically: a publish can be refused,
  and the screen should never show a state that is not true. Signing out clears the cache.
- During construction: the organiser's events load as one query, and the Published, Drafts and Past
  tabs are views of it. That gives counts on every tab, instant switching, and an event that moves
  between tabs by itself after publishing, because there is only one cache to update. Organisers
  have tens of events; with hundreds, this becomes one query per tab with cursor pagination. Whether
  an event is past is decided on the server, so the server and browser always render the same.

## Creating and editing events (during construction)

- An event's time is what the organiser typed on the venue's wall clock. The form sends the date
  and time as plain text with the venue; the server turns them into an instant with the venue's
  zone, never the browser's or the server's. A time that does not exist (clocks jumping forward) is
  refused with the next valid time suggested, rather than shifted silently; a time that happens
  twice takes its first occurrence. Day.js does the zone arithmetic, and the rules are pinned by
  unit tests on Node's own test runner (Kigali, London and New York around their clock changes, a
  leap day, midnight crossings), run with the machine set to different zones.
- An event and its tiers, and a venue created in the same form, are saved by one database function
  in one transaction, so a refused save leaves nothing half written. It runs as the organiser, so
  the access policies still apply. Not taken: several requests from the server, which can fail
  halfway.
- Prices are typed in the currency's own units ("8000" francs, "12.50" pounds) and stored in its
  smallest unit, worked out on the digits rather than with floating point.
- The form checks with the same schema as the server, field by field, the sign-in way: a message
  appears when a field is left and goes as soon as it is fixed. A passed date only warns on a
  draft, and blocks on a published event only when the date moves, as the database does, so an
  event that has ended can still have a typo fixed.

## Venues (during construction)

- Venues have their own page, as well as being created inside the event form. Editing one tells
  the organiser before saving what it does to the events there.
- When a venue's timezone changes, its events to come keep their times as typed ("19:30" stays
  19:30, now in the new zone): the database moves their instants in the same transaction as the
  venue, and refuses the change if one would land in a clock change. Events that have ended keep
  their recorded time. Not taken: changing the zone alone, which would silently move every event
  there by the difference.
- A venue can be deleted only while no event uses it, past ones included, because the database
  refuses otherwise; the page says why instead of failing. Undo creates it again as it was, which
  is the same venue, since nothing pointed to it.

## Account (during construction)

- The account page shows the organiser name with a preview of how the public sees it, since it
  appears on every published event; renaming touches the organiser's events so their public pages
  refresh, as tier and venue changes do. The email is read-only: there is no mail service to
  confirm a new address.
- Changing the password checks the current one first, so someone at a computer left signed in
  cannot lock the owner out. The check signs in on a separate client that keeps no cookies and
  ends that extra session at once. Supabase leaves other sessions open after a password change, so
  the page says so and offers "Sign out everywhere" next to it.
- Theme and contrast are settings, kept in cookies so the server renders the right colours on the
  first paint. High contrast is Material's own contrast level for the same navy scheme, light and
  dark, rather than a separate palette.
- A session ended elsewhere keeps a valid-looking token until it expires. On the sign-in page the
  proxy asks Supabase Auth itself and clears an ended session's cookies; before, the sign-in page
  and the pages sent each other back and forth.

## Styling (decided during construction)

- Material Design by Google, built by hand on Tailwind as Material 3: tokens generated with
  Google's Material colour library (the engine behind Theme Builder), Roboto, and Material icons
  inlined as SVG. MUI follows Material 2, and Google's own web components are in maintenance mode
  and render only in the browser, which works against SEO.
- Colour: royal navy (`#1E3A8A`) with Material's fidelity scheme, which keeps the seed's own depth
  instead of muting it, at standard contrast in light and dark, following the device. I went
  through coral and several ambers first, and violet is Material's default (one may have thought I
  didn't bother choosing). The ambers either turned brown in light mode or glared in dark mode;
  this navy stays deep in light and becomes a calm light blue in dark. Material 3 has no warning
  colour, so a custom one fills the role: gold harmonised to the navy (orange harmonised into a
  red too close to the error colour).
- The product is called Tiketi (Swahili for "ticket"), so both apps read as one platform. Messages
  follow one rule: errors block and say how to fix them, warnings inform without blocking, and info
  explains why you are on a page. Field messages fit one line, banners at most two.
- The organiser app has a rail of sections (Events now; Venues and Account as they are built) and
  a bottom bar on phones. I considered a top bar with tabs alone, but venues are real records worth
  their own page. The rail collapses to icons, with labels as tooltips; it pushes the content
  rather than covering it, and the choice is kept in a cookie so the server renders the same width
  on the next visit, with no jump. Sign out sits in an account menu behind the avatar.
- Motion explains a change rather than decorating it: pages and rows rise in, and the tab
  underline slides, using Material's curves and staying around 250 milliseconds. People who ask
  their system for reduced motion get short fades only.

## Deployment (before building)

- Each app folder is linked to its own Vercel project with the CLI and deployed from there.
- Two Supabase environments: a local stack for building and testing, the hosted project for the
  deployed apps.
- During construction: both apps pin pnpm 12 in `packageManager`. Vercel picks pnpm's version from
  the lockfile (9 or 10) unless told otherwise, so each project sets
  `ENABLE_EXPERIMENTAL_COREPACK=1`, which makes it use the pinned version: the same pnpm locally and
  on Vercel. The projects are named after their folders, with `zolender-` added to the
  `.vercel.app` addresses because the plain names were taken. Deploys go through the CLI only;
  the Git integration is deliberately not connected.
- During construction: the database is in Frankfurt and both apps' functions run there too
  (`vercel.json`), because the distance that matters is between the functions and the database,
  and Europe is the closest well-served region to a Kigali audience.
- The hosted project is managed with the Supabase CLI: migrations with `db push`, and its auth
  settings (sign-up closed, password minimum, site URL) from `config.toml` with `config push`. A
  `[remotes.production]` block overrides what differs from local development, so the settings are
  reviewable in the repository rather than hidden in a dashboard.
- Seed data goes through Supabase's own APIs with one script for both environments; it reads the
  target, the secret key and the passwords from environment variables, so no credential lives in
  this public repository.

- During construction: cached public pages are refreshed by the database itself. A trigger on
  events calls the public site through Postgres's `pg_net` whenever a change involves a published
  event, and only once the change is committed; tier, venue and organiser changes reach it through
  the touch they already make on their events. The address and shared secret live in Supabase
  Vault, so they are set per environment and never in this repository, and the trigger is in a
  migration a reviewer can read. I considered the dashboard's webhook screen (quicker, but
  invisible in the repository). The route checks the secret in constant time and expires every
  cached page, since one change can show on several pages; the next visit makes each again.
  Tested on a production build: a cached page answered 404 on the very next visit after its event
  was unpublished.
- During construction: a small set of security headers in both apps (no framing of the organiser
  app at all, no content sniffing, a strict referrer, no camera, microphone or location). A full
  Content Security Policy is left out for now: it needs a nonce per request, which would make
  every cached page dynamic.
- During construction: a daily Vercel cron reads one row of the public view, because Supabase's
  free plan pauses a project after a week without activity and a reviewer should never meet a
  paused database.

## With more time

- A dedicated backend, and checkout (whose hard part is never overselling the last ticket).
- Image uploads in a private storage bucket, a strict Content Security Policy, a stepped create
  form, event end times, an end-to-end test suite.
- Full-text search with stemming and ranking; "more from this organiser" on event pages.
- Our own sign-in rate limit, per address and per account. Every sign-in reaches Supabase from our
  server, so Supabase's per-address limit (30 attempts in 5 minutes) sees one shared address.
