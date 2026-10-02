# Tiketi

A small event ticketing platform (the product is called Tiketi, Swahili for "ticket"). Visitors browse upcoming events and read their details;
organisers sign in to create, edit and publish the events they own. Every event is either a draft,
seen only by its organiser, or published. Checkout and payments are out of scope.

## What is in this repository

Two independent Next.js applications side by side, and the database they both rely on:

| Folder              | What it is                                               |
| ------------------- | -------------------------------------------------------- |
| `events-public/`    | The public site: home, events list, event detail pages   |
| `events-organiser/` | The organiser app: sign in, your events, create and edit |
| `supabase/`         | Schema, access policies, seed data and database tests    |

The two apps share no code and never call each other; the database is their only meeting point.
Why it is built this way is in [DECISIONS.md](DECISIONS.md).

## Stack

Next.js 16 (App Router), TypeScript, TanStack Query, Tailwind CSS with Material 3 design tokens,
Supabase (Postgres, Auth, row-level security), deployed to Vercel with the Vercel CLI, pnpm.

## Live

| App           | Address                                      |
| ------------- | -------------------------------------------- |
| Public site   | https://zolender-events-public.vercel.app    |
| Organiser app | https://zolender-events-organiser.vercel.app |

## Running locally

You need Node 24 (the unit tests run TypeScript directly on Node's own test runner), pnpm 12,
Docker, and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
# 1. The database: Postgres, Auth and the API in Docker, built from the migrations
supabase start
supabase db reset                      # rebuilds the local database from supabase/migrations

# 2. Seed data: three organisers, their venues and events in every state
eval "$(supabase status -o env)"
SUPABASE_URL="$API_URL" SUPABASE_SECRET_KEY="$SECRET_KEY" SEED_PASSWORD=<choose one> \
  node supabase/seed/seed.mjs

# 3. Each app, in its own terminal
cd events-public && pnpm install && pnpm dev       # http://localhost:3000
cd events-organiser && pnpm install && pnpm dev    # http://localhost:3001
```

Each app reads a `.env.local`; its `.env.example` lists the names. Locally,
`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are the `API_URL` and `PUBLISHABLE_KEY` printed by
`supabase status`. The seeded organisers sign in with the `SEED_PASSWORD` you chose:
`kigali.live@example.com`, `ubumuntu.arts@example.com`, `thames.kigali@example.com`.

Checks:

```bash
supabase test db                       # pgTAP: access rules, publishing rules, search, refresh
cd events-public && pnpm check         # Prettier, ESLint, TypeScript, unit tests
cd events-organiser && pnpm check
```

## Deploying

Each app folder is linked to its own Vercel project and deployed from there with the CLI:

```bash
cd events-public && vercel --prod
cd events-organiser && vercel --prod
```

Settings per Vercel project (Production), all read on the server only; none reaches the browser:

| Setting                                    | Public site                                                    | Organiser app             |
| ------------------------------------------ | -------------------------------------------------------------- | ------------------------- |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | yes                                                            | yes                       |
| `SITE_URL`                                 | this site's address                                            |                           |
| `ORGANISER_URL`                            | the organiser app's address                                    |                           |
| `PUBLIC_SITE_URL`                          |                                                                | the public site's address |
| `REVALIDATE_SECRET`                        | random; the same value as Vault's `public_site_refresh_secret` |                           |
| `CRON_SECRET`                              | random (Vercel sends it with the daily keep-alive)             |                           |
| `ENABLE_EXPERIMENTAL_COREPACK`             | `1` (use the pnpm pinned in `package.json`)                    | `1`                       |

The hosted database is changed only with the Supabase CLI:

```bash
supabase link --project-ref <project ref>
supabase db push --dry-run && supabase db push     # new migrations only, never a reset
supabase config diff && supabase config push        # auth settings from supabase/config.toml
```

Once per environment, in the hosted project's SQL editor, tell the database where to refresh the
public site's cached pages (the secret never goes in the repository):

```sql
select vault.create_secret('https://<public site>/api/revalidate', 'public_site_refresh_url');
select vault.create_secret('<REVALIDATE_SECRET>', 'public_site_refresh_secret');
```
