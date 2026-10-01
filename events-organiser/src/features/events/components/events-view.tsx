"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AddIcon,
  DraftIcon,
  ErrorIcon,
  EventsIcon,
  HistoryIcon,
  LiveIcon,
} from "@/components/ui/icons";
import { useOnline } from "@/lib/use-online";
import { myEventsQuery } from "../queries";
import { groupByTab, parseTab, tabLabels, tabs, type Tab } from "../tabs";
import { EventRow } from "./event-row";

// No display class here, so each use decides when the button shows.
const newEventClasses =
  "h-10 items-center gap-2 rounded-full bg-primary px-4 pr-6 text-label-lg text-on-primary hover:opacity-92 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function EventsView() {
  const tab = parseTab(useSearchParams().get("tab"));
  const online = useOnline();
  const { data, error, isPending, isRefetchError, refetch, isFetching } =
    useQuery(myEventsQuery());

  // The tab lives in the URL; switching only rewrites it, the data is already here.
  function selectTab(event: MouseEvent<HTMLAnchorElement>, next: Tab) {
    event.preventDefault();
    window.history.pushState(null, "", `?tab=${next}`);
  }

  if (data && data.length === 0) {
    return (
      <EmptyState
        icon={EventsIcon}
        title="Create your first event"
        action={
          <Link href="/events/new" className={`inline-flex ${newEventClasses}`}>
            <AddIcon />
            New event
          </Link>
        }
      >
        New events start as drafts that only you can see. Publish one when it is
        ready and it appears on the public site.
      </EmptyState>
    );
  }

  const groups = data ? groupByTab(data) : null;
  const rows = groups?.[tab] ?? [];

  return (
    <div className="flex flex-1 flex-col gap-4">
      {!online && (
        <Banner kind="info" title="You're offline">
          Your events will refresh when you&apos;re back online.
        </Banner>
      )}
      {online && isRefetchError && (
        <Banner kind="warning" title="Couldn't refresh">
          Showing what was loaded earlier.
        </Banner>
      )}

      <div className="flex items-end gap-4 border-b border-outline-variant">
        <nav
          role="tablist"
          aria-label="Events"
          className="flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((value) => (
            <a
              key={value}
              href={`?tab=${value}`}
              role="tab"
              aria-selected={value === tab}
              onClick={(event) => selectTab(event, value)}
              className="-mb-px border-b-3 border-transparent px-4 py-3 text-title-sm whitespace-nowrap text-on-surface-variant hover:text-on-surface aria-selected:border-primary aria-selected:text-primary"
            >
              {tabLabels[value]}
              {groups && (
                <>
                  {" "}
                  <span className="text-body-md tabular-nums">
                    ({groups[value].length})
                  </span>
                </>
              )}
            </a>
          ))}
        </nav>
        <Link
          href="/events/new"
          className={`mb-2 hidden sm:inline-flex ${newEventClasses}`}
        >
          <AddIcon />
          New event
        </Link>
      </div>

      <div
        role="tabpanel"
        aria-label={tabLabels[tab]}
        className="flex flex-1 flex-col"
      >
        {isPending ? (
          <ul
            aria-busy="true"
            aria-label="Loading events"
            className="flex flex-col gap-2"
          >
            {[0, 1, 2].map((index) => (
              <li
                key={index}
                className="flex flex-col gap-2 rounded-md bg-surface-container-low px-4 py-4"
              >
                <span className="h-3.5 w-2/5 rounded-full bg-surface-container-high" />
                <span className="h-3 w-3/4 rounded-full bg-surface-container-high" />
              </li>
            ))}
          </ul>
        ) : error && !data ? (
          <EmptyState
            icon={ErrorIcon}
            tone="error"
            title="Couldn't load your events"
            action={
              <Button onClick={() => refetch()} disabled={isFetching}>
                Try again
              </Button>
            }
          >
            Check your connection, then try again.
          </EmptyState>
        ) : rows.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rows.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <EmptyTab
            tab={tab}
            hasDrafts={(groups?.drafts.length ?? 0) > 0}
            onSeeDrafts={selectTab}
          />
        )}
      </div>

      {/* Phones: the main action floats under the thumb. */}
      <Link
        href="/events/new"
        className="fixed right-4 bottom-20 inline-flex h-14 items-center gap-2 rounded-lg bg-primary px-5 text-label-lg text-on-primary shadow-lg sm:hidden"
      >
        <AddIcon />
        New event
      </Link>
    </div>
  );
}

function EmptyTab({
  tab,
  hasDrafts,
  onSeeDrafts,
}: {
  tab: Tab;
  hasDrafts: boolean;
  onSeeDrafts: (event: MouseEvent<HTMLAnchorElement>, tab: Tab) => void;
}) {
  if (tab === "published") {
    return (
      <EmptyState
        icon={LiveIcon}
        title="Nothing live yet"
        action={
          hasDrafts && (
            <a
              href="?tab=drafts"
              onClick={(event) => onSeeDrafts(event, "drafts")}
              className="rounded-full px-3 py-2 text-label-lg text-primary hover:bg-primary/8"
            >
              See drafts
            </a>
          )
        }
      >
        Publish a draft and it appears here and on the public site.
      </EmptyState>
    );
  }
  if (tab === "drafts") {
    return (
      <EmptyState icon={DraftIcon} title="No drafts">
        New events start here, visible only to you.
      </EmptyState>
    );
  }
  return (
    <EmptyState icon={HistoryIcon} title="No past events yet">
      Events move here once their date has passed.
    </EmptyState>
  );
}
