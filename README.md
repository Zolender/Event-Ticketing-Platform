# Event Ticketing Platform

A small event ticketing platform. Visitors browse upcoming events and read their details;
organisers sign in to create, edit and publish the events they own. Every event is either a draft,
seen only by its organiser, or published. Checkout and payments are out of scope.

## What is in this repository

Two independent Next.js applications side by side, and the database they both rely on:

| Folder | What it is |
| --- | --- |
| `events-public/` | The public site: home, events list, event detail pages |
| `events-organiser/` | The organiser app: sign in, your events, create and edit |
| `supabase/` | Schema, access policies, seed data and database tests |

The two apps share no code and never call each other; the database is their only meeting point.
Why it is built this way is in [DECISIONS.md](DECISIONS.md).

## Stack

Next.js 16 (App Router), TypeScript, TanStack Query, Tailwind CSS with Material 3 design tokens,
Supabase (Postgres, Auth, row-level security), deployed to Vercel with the Vercel CLI, pnpm.

## Running locally

To be written.

## Deploying

To be written.

## Signing in

Organiser credentials were sent with the submission.
