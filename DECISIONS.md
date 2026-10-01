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

## Data and state (before building)

- TanStack Query where server state changes under the user: the organiser app (server prefetch,
  hydration, mutations, invalidation) and the public list (load more by cursor, search kept in the
  URL). One data access function serves both the server prefetch and the route handler.
- Publishing waits for the server rather than updating optimistically: a publish can be refused,
  and the screen should never show a state that is not true. Signing out clears the cache.

## Styling (decided during construction)

- Material Design by Google, built by hand on Tailwind as Material 3: tokens generated with
  Google's Material colour library (the engine behind Theme Builder), Roboto, and Material icons
  inlined as SVG. MUI follows Material 2, and Google's own web components are in maintenance mode
  and render only in the browser, which works against SEO.
- Colour: amber, at Material's medium contrast, in light and dark following the device. I started
  with coral, then compared eight hues as real sign-in screens: deep blue felt generic, and violet
  is Material's default colour (one may have thought I didn't bother choosing). A custom warning
  colour, orange harmonised to amber, fills the role Material 3 does not define.
- The product is called Tiketi (Swahili for "ticket"), so both apps read as one platform. Messages
  follow one rule: errors block and say how to fix them, warnings inform without blocking, and info
  explains why you are on a page. Field messages fit one line, banners at most two.

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

## With more time

- A dedicated backend, and checkout (whose hard part is never overselling the last ticket).
- Image uploads in a private storage bucket, a strict Content Security Policy, a stepped create
  form, event end times, an end-to-end test suite.
- Our own sign-in rate limit, per address and per account. Every sign-in reaches Supabase from our
  server, so Supabase's per-address limit (30 attempts in 5 minutes) sees one shared address.
