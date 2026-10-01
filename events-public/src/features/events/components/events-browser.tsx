"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CalendarIcon,
  CloseIcon,
  ErrorIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { SEARCH_PLACEHOLDER } from "@/features/search/header-search";
import { useOnline } from "@/lib/use-online";
import { groupByMonth } from "../months";
import { upcomingEventsQuery } from "../queries";
import { normaliseSearch, SEARCH_MAX } from "../search";
import { EventCard } from "./event-card";

/** Visitors type slowly; the list waits for a pause before it searches. */
const SEARCH_DELAY = 500;

/**
 * The list: ticket cards under month headings, Load more by cursor, and search as you type. The
 * search lives in the URL (replaced, not pushed, so Back leaves the page rather than stepping
 * through every letter). While a new search loads, the previous results stay on screen.
 */
export function EventsBrowser({
  initialSearch,
}: {
  initialSearch: string | null;
}) {
  const [input, setInput] = useState(initialSearch ?? "");
  const [search, setSearch] = useState(initialSearch);
  const field = useRef<HTMLInputElement>(null);
  const online = useOnline();

  function apply(value: string) {
    const next = normaliseSearch(value);
    setSearch(next);
    const url = next ? `/events?q=${encodeURIComponent(next)}` : "/events";
    if (url !== `${location.pathname}${location.search}`)
      window.history.replaceState(null, "", url);
  }

  const onPause = useEffectEvent(() => apply(input));
  useEffect(() => {
    if (normaliseSearch(input) === search) return;
    const timer = setTimeout(onPause, SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [input, search]);

  const query = useInfiniteQuery({
    ...upcomingEventsQuery(search),
    placeholderData: keepPreviousData,
  });
  const events = query.data?.pages.flatMap((page) => page.events) ?? [];
  const total = query.data?.pages[0]?.total;
  const searching = query.isFetching && !query.isFetchingNextPage;

  function clear() {
    setInput("");
    apply("");
    field.current?.focus();
  }

  return (
    <div className="flex flex-col gap-7">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          apply(input);
        }}
        className="flex h-14 max-w-150 items-center gap-3 rounded-full bg-surface-container-high pr-2 pl-4 text-on-surface-variant focus-within:outline-2 focus-within:outline-primary"
      >
        <SearchIcon />
        <label htmlFor="events-search" className="sr-only">
          {SEARCH_PLACEHOLDER}
        </label>
        <input
          ref={field}
          id="events-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={SEARCH_MAX}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER}
          className="h-full min-w-0 flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant [&::-webkit-search-cancel-button]:hidden"
        />
        {searching && <Spinner className="size-5 text-primary" />}
        {input && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <CloseIcon className="size-5" />
          </button>
        )}
      </form>

      {!online && (
        <Banner kind="offline" title="You're offline.">
          Showing what was already loaded.
        </Banner>
      )}

      <p
        aria-live="polite"
        className="-mt-3 text-body-md text-on-surface-variant empty:hidden"
      >
        {search && total !== undefined && events.length > 0
          ? `${total} ${total === 1 ? "event" : "events"} for “${search}”`
          : ""}
      </p>

      {query.isPending ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Placeholders count={6} />
        </ul>
      ) : query.isError && !query.data ? (
        <EmptyState
          icon={ErrorIcon}
          title="Couldn't load events"
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        >
          Something went wrong on our side. Try again in a moment.
        </EmptyState>
      ) : events.length === 0 ? (
        search ? (
          <EmptyState
            icon={SearchIcon}
            title={`No events match “${search}”`}
            action={
              <Button variant="tonal" onClick={clear}>
                See all events
              </Button>
            }
          >
            Check the spelling, or try a venue or a city.
          </EmptyState>
        ) : (
          <EmptyState
            icon={CalendarIcon}
            title="No events coming up"
            action={
              <Link href="/" className={buttonClass("tonal")}>
                Back to home
              </Link>
            }
          >
            New events appear here as organisers publish them.
          </EmptyState>
        )
      ) : (
        <>
          <div
            className={`flex flex-col gap-7 transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}
          >
            {groupByMonth(events).map((group, groupIndex, groups) => (
              <section
                key={group.label}
                aria-labelledby={`month-${groupIndex}`}
              >
                <h2
                  id={`month-${groupIndex}`}
                  className="mb-3 text-title-md text-on-surface-variant"
                >
                  {group.label}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.events.map((event, index) => (
                    <li key={event.publicId}>
                      <EventCard event={event} index={index} />
                    </li>
                  ))}
                  {query.isFetchingNextPage &&
                    groupIndex === groups.length - 1 && (
                      <Placeholders count={3} />
                    )}
                </ul>
              </section>
            ))}
          </div>

          {query.isFetchNextPageError ? (
            <Banner
              kind="error"
              title="Couldn't load more events."
              action={
                <Button
                  variant="text"
                  className="px-3 text-on-error-container before:bg-on-error-container"
                  onClick={() => query.fetchNextPage()}
                >
                  Try again
                </Button>
              }
            >
              Check your connection.
            </Banner>
          ) : query.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outlined"
                disabled={!online || query.isFetchingNextPage}
                aria-busy={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? (
                  <>
                    <Spinner />
                    Loading
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          ) : (
            <p className="text-center text-body-md text-on-surface-variant">
              That&apos;s everything coming up.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** Ticket-shaped placeholders where events are about to appear. */
function Placeholders({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <li
      key={`placeholder-${index}`}
      aria-hidden="true"
      className="flex h-36 animate-pulse flex-col gap-2.5 rounded-lg bg-surface-container-low px-4 py-4 motion-reduce:animate-none"
    >
      <span className="h-4.5 w-2/3 rounded-full bg-surface-container-highest" />
      <span className="h-3.5 w-1/2 rounded-full bg-surface-container-highest" />
      <span className="h-3.5 w-2/5 rounded-full bg-surface-container-highest" />
    </li>
  ));
}
