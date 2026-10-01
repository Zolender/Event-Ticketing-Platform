import Link from "next/link";
import type { ReactNode } from "react";
import { EventsIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { requireOrganiser } from "@/server/auth";

// Layout B: a rail of app sections on tablets and up, a bottom bar on phones. Events is the only
// section until Venues and Account are built. Collapsing and tooltips come with the design pass.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const organiser = await requireOrganiser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center gap-3 bg-surface-container px-4 sm:px-6">
        <Link href="/events" className="flex items-center gap-2">
          <Logo className="size-7" />
          <span className="text-title-lg">Tiketi</span>
          <span className="hidden text-body-sm text-on-surface-variant sm:inline">
            for organisers
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-body-md text-on-surface-variant sm:inline">
            {organiser.displayName}
          </span>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1">
        <nav
          aria-label="Sections"
          className="hidden w-20 shrink-0 flex-col items-center gap-3 border-r border-outline-variant bg-surface-container-low py-4 sm:flex"
        >
          <Link
            href="/events"
            aria-current="page"
            className="flex flex-col items-center gap-1 text-label-md"
          >
            <span className="grid h-8 w-14 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
              <EventsIcon />
            </span>
            Events
          </Link>
        </nav>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-24 sm:px-6 sm:pb-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around bg-surface-container sm:hidden"
      >
        <Link
          href="/events"
          aria-current="page"
          className="flex flex-col items-center gap-1 text-label-md"
        >
          <span className="grid h-8 w-16 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
            <EventsIcon />
          </span>
          Events
        </Link>
      </nav>
    </div>
  );
}
