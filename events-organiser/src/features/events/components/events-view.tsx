"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, type MouseEvent } from "react";
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
  const tablistRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placedRef = useRef(false);

  // The underline slides from tab to tab: it follows the selected tab's box, and the box again
  // when it changes size (counts arriving, the rail resizing the page). The first placement
  // does not animate.
  useLayoutEffect(() => {
    const list = tablistRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;
    const place = () => {
      const selected = list.querySelector<HTMLElement>(
        '[aria-selected="true"]',
      );
      if (!selected) return;
      if (!placedRef.current) indicator.style.transition = "none";
      indicator.style.width = `${selected.offsetWidth}px`;
      indicator.style.transform = `translateX(${selected.offsetLeft}px)`;
      if (!placedRef.current) {
        void indicator.offsetWidth;
        indicator.style.transition = "";
        placedRef.current = true;
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [tab, data]);

  // The tab lives in the URL; switching only rewrites it, the data is already here.
  function selectTab(event: MouseEvent<HTMLAnchorElement>, next: Tab) {
    event.preventDefault();
    window.history.pushState(null, "", `?tab=${next}`);
  }

  const groups = data ? groupByTab(data) : null;
  const rows = groups?.[tab] ?? [];
  // A new organiser keeps the tabs, so the page reads as usual, and the first-event message takes
  // the panel; its button is then the only "New event" on screen.
  const noEvents = data?.length === 0;

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
          ref={tablistRef}
          role="tablist"
          aria-label="Events"
          className="relative flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((value) => (
            <a
              key={value}
              href={`?tab=${value}`}
              role="tab"
              aria-selected={value === tab}
              onClick={(event) => selectTab(event, value)}
              className="rounded-t-sm px-4 py-3 text-title-sm whitespace-nowrap text-on-surface-variant transition-colors duration-150 hover:bg-on-surface/8 hover:text-on-surface aria-selected:text-primary"
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
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-t-full bg-primary transition-[transform,width] duration-250 ease-emphasized-decelerate motion-reduce:transition-none"
          />
        </nav>
        <Link
          href="/events/new"
          className={`mb-2 hidden ${noEvents ? "" : "sm:inline-flex"} ${newEventClasses}`}
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
        ) : noEvents ? (
          <div
            key="first"
            className="flex flex-1 animate-rise flex-col motion-reduce:animate-fade"
          >
            <EmptyState
              icon={EventsIcon}
              title="Create your first event"
              action={
                <Link
                  href="/events/new"
                  className={`inline-flex ${newEventClasses}`}
                >
                  <AddIcon />
                  New event
                </Link>
              }
            >
              New events start as drafts that only you can see. Publish one when
              it is ready and it appears on the public site.
            </EmptyState>
          </div>
        ) : rows.length > 0 ? (
          // Keyed by tab, so a tab switch replays the rows rising in; a data refresh does not.
          <ul key={tab} className="flex flex-col gap-2">
            {rows.map((event, index) => (
              <EventRow key={event.id} event={event} index={index} />
            ))}
          </ul>
        ) : (
          <EmptyTab
            key={tab}
            tab={tab}
            hasDrafts={(groups?.drafts.length ?? 0) > 0}
            onSeeDrafts={selectTab}
          />
        )}
      </div>

      {/* Phones: the main action floats under the thumb. */}
      {!noEvents && (
        <Link
          href="/events/new"
          className="fixed right-4 bottom-20 inline-flex h-14 items-center gap-2 rounded-lg bg-primary px-5 text-label-lg text-on-primary shadow-lg sm:hidden"
        >
          <AddIcon />
          New event
        </Link>
      )}
    </div>
  );
}

function EmptyTab(props: Parameters<typeof EmptyTabContent>[0]) {
  return (
    <div className="flex flex-1 flex-col animate-rise motion-reduce:animate-fade">
      <EmptyTabContent {...props} />
    </div>
  );
}

function EmptyTabContent({
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
