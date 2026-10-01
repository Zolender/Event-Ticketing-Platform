"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { EventsIcon, MenuIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { SnackbarHost } from "@/components/ui/snackbar";
import { AccountMenu } from "@/features/auth/account-menu";

export type RailState = "auto" | "expanded" | "collapsed";

const RAIL_COOKIE = "rail";
const ONE_YEAR = 60 * 60 * 24 * 365;

type AppShellProps = {
  rail: RailState;
  organiser: { displayName: string; email: string };
  children: ReactNode;
};

// "auto" follows the screen (expanded from xl); once toggled, the choice lives in a cookie so the
// server renders the same width straight away. Rail styles key off `data-rail` on the shell.
export function AppShell({
  rail: initialRail,
  organiser,
  children,
}: AppShellProps) {
  const [rail, setRail] = useState<RailState>(initialRail);

  function toggleRail() {
    const expandedNow =
      rail === "expanded" ||
      (rail === "auto" && window.matchMedia("(min-width: 80rem)").matches);
    const next = expandedNow ? "collapsed" : "expanded";
    setRail(next);
    document.cookie = `${RAIL_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }

  return (
    <div data-rail={rail} className="group/shell flex min-h-dvh flex-col">
      <header className="flex h-16 items-center gap-2 bg-surface-container pr-4 pl-3 sm:pr-6">
        <button
          type="button"
          onClick={toggleRail}
          aria-label="Expand or collapse navigation"
          aria-controls="sections"
          className="hidden h-12 w-14 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary sm:grid"
        >
          <MenuIcon />
        </button>
        <Link href="/events" className="flex items-center gap-2 pl-1 sm:pl-0">
          <Logo className="size-7" />
          <span className="text-title-lg">Tiketi</span>
          <span className="hidden text-body-sm text-on-surface-variant sm:inline">
            for organisers
          </span>
        </Link>
        <div className="ml-auto">
          <AccountMenu
            displayName={organiser.displayName}
            email={organiser.email}
          />
        </div>
      </header>

      <div className="flex flex-1">
        <nav
          id="sections"
          aria-label="Sections"
          className="hidden w-20 shrink-0 flex-col gap-1 border-r border-outline-variant bg-surface-container-low p-3 transition-[width] duration-250 ease-standard motion-reduce:transition-none group-data-[rail=expanded]/shell:w-58 sm:flex xl:group-data-[rail=auto]/shell:w-58"
        >
          <RailLink href="/events" label="Events" current>
            <EventsIcon />
          </RailLink>
        </nav>
        <main className="mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col px-4 py-6 pb-24 sm:px-6 sm:pb-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-10 flex h-16 items-center justify-around bg-surface-container sm:hidden"
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
      <SnackbarHost />
    </div>
  );
}

/** A rail entry: icon and label when expanded; icon only when collapsed, the label as a tooltip. */
function RailLink({
  href,
  label,
  current,
  children,
}: {
  href: string;
  label: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={`group/item relative flex h-12 items-center gap-3 rounded-full px-4 text-label-lg whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary ${
        current
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-on-surface/8"
      }`}
    >
      <span className="shrink-0">{children}</span>
      <span
        aria-hidden="true"
        className="invisible opacity-0 transition-opacity duration-150 group-data-[rail=expanded]/shell:visible group-data-[rail=expanded]/shell:opacity-100 xl:group-data-[rail=auto]/shell:visible xl:group-data-[rail=auto]/shell:opacity-100"
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-full z-20 ml-3 -translate-y-1/2 scale-90 rounded-xs bg-inverse-surface px-2 py-1 text-body-sm text-inverse-on-surface opacity-0 transition-[opacity,scale] duration-150 group-hover/item:scale-100 group-hover/item:opacity-100 group-hover/item:delay-400 group-focus-visible/item:scale-100 group-focus-visible/item:opacity-100 group-data-[rail=expanded]/shell:hidden motion-reduce:transition-none xl:group-data-[rail=auto]/shell:hidden"
      >
        {label}
      </span>
    </Link>
  );
}
