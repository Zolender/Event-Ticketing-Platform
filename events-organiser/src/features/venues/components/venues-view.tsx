"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Banner, type BannerKind } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/ui/collapse";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AddIcon,
  ArrowDownIcon,
  DeleteIcon,
  EditIcon,
  ErrorIcon,
  EventsIcon,
  PlaceIcon,
  ScheduleIcon,
} from "@/components/ui/icons";
import { OverflowMenu } from "@/components/ui/overflow-menu";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/fetch-json";
import { showSnackbar } from "@/lib/snackbar";
import { StatusChip } from "../../events/components/status-chip";
import { formatEventDate } from "../../events/format";
import {
  restoreVenue,
  useCreateVenue,
  useDeleteVenue,
  useUpdateVenue,
} from "../mutations";
import { myVenuesQuery } from "../queries";
import type { VenueWithEvents } from "../types";
import { duplicateOf, venueChangeImpact } from "../venue-impact";
import type { VenueInput } from "../venue-schema";
import { zoneCity } from "../zones";
import { emptyVenue, VenueFields } from "./venue-fields";
import { useVenueForm } from "./use-venue-form";

type Notice = { kind: BannerKind; title: string; text: string };

const notices: Record<string, Notice> = {
  offline: {
    kind: "error",
    title: "Can't reach Tiketi",
    text: "Check your connection. Your changes are still here.",
  },
  time_gap: {
    kind: "error",
    title: "Can't change the timezone",
    text: "An event here would fall in a clock change there. Move it first.",
  },
  event_would_pass: {
    kind: "error",
    title: "Can't change the timezone",
    text: "A published event here would move into the past there.",
  },
  not_found: {
    kind: "error",
    title: "This venue no longer exists",
    text: "It may have been deleted in another tab.",
  },
  unexpected: {
    kind: "error",
    title: "Something went wrong",
    text: "Try saving again.",
  },
};
const noticeFor = (error: Error) =>
  notices[error instanceof ApiError ? error.code : "unexpected"] ??
  notices.unexpected;

/** The clock, read after mount and every half minute, for each venue's local time. */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const newVenueClasses =
  "h-10 items-center gap-2 rounded-full bg-primary pr-6 pl-4 text-label-lg text-on-primary hover:opacity-92 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function VenuesView() {
  const {
    data: venues,
    error,
    isPending,
    refetch,
    isFetching,
  } = useQuery(myVenuesQuery());
  const [adding, setAdding] = useState(false);
  const now = useNow();

  function startAdding() {
    setAdding(true);
    setTimeout(() => document.getElementById("new-name")?.focus());
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-headline-md">Venues</h1>
          <p className="mt-1 max-w-prose text-body-md text-on-surface-variant">
            Places you host events. A change here follows to every event that
            uses the venue.
          </p>
        </div>
        <button
          type="button"
          onClick={startAdding}
          disabled={adding}
          className={`hidden disabled:opacity-38 sm:inline-flex ${newVenueClasses}`}
        >
          <AddIcon />
          New venue
        </button>
      </header>

      <Collapse open={adding}>
        <NewVenueCard
          venues={venues ?? []}
          now={now}
          onDone={() => setAdding(false)}
        />
      </Collapse>

      {isPending ? (
        <ul
          aria-busy="true"
          aria-label="Loading venues"
          className="flex flex-col gap-2"
        >
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className="flex flex-col gap-2 rounded-lg bg-surface-container-low px-4 py-5"
            >
              <span className="h-3.5 w-2/5 rounded-full bg-surface-container-high" />
              <span className="h-3 w-3/5 rounded-full bg-surface-container-high" />
            </li>
          ))}
        </ul>
      ) : error && !venues ? (
        <EmptyState
          icon={ErrorIcon}
          tone="error"
          title="Couldn't load your venues"
          action={
            <Button onClick={() => refetch()} disabled={isFetching}>
              Try again
            </Button>
          }
        >
          Check your connection, then try again.
        </EmptyState>
      ) : venues && venues.length === 0 && !adding ? (
        <EmptyState
          icon={PlaceIcon}
          title="No venues yet"
          action={
            <button
              type="button"
              onClick={startAdding}
              className={`inline-flex ${newVenueClasses}`}
            >
              <AddIcon />
              New venue
            </button>
          }
        >
          Add the places you host events. You can also create one while making
          an event.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {venues?.map((venue, index) => (
            <VenueRow
              key={venue.id}
              venue={venue}
              venues={venues}
              index={index}
              now={now}
            />
          ))}
        </ul>
      )}

      {/* Phones: the main action floats under the thumb. */}
      {!adding && (
        <button
          type="button"
          onClick={startAdding}
          className="fixed right-4 bottom-20 z-10 inline-flex h-14 cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 text-label-lg text-on-primary shadow-lg sm:hidden"
        >
          <AddIcon />
          New venue
        </button>
      )}
    </div>
  );
}

function NewVenueCard({
  venues,
  now,
  onDone,
}: {
  venues: VenueWithEvents[];
  now: number | null;
  onDone: () => void;
}) {
  const form = useVenueForm(emptyVenue, "new-venue");
  const create = useCreateVenue();
  const [notice, setNotice] = useState<Notice | null>(null);
  const duplicate = duplicateOf(venues, form.draft);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (create.isPending || !form.check()) return;
    setNotice(null);
    create.mutate(form.input, {
      onSuccess: () => {
        showSnackbar("Venue added.");
        onDone();
      },
      onError: (error) => {
        if (error instanceof ApiError && Object.keys(error.fields).length)
          return form.showServerErrors(error.fields);
        setNotice(noticeFor(error));
      },
    });
  }

  return (
    <form
      id="new-venue"
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface p-4 [--field-bg:var(--color-surface)] sm:p-5"
    >
      <h2 className="flex items-center gap-2 text-title-md">
        <PlaceIcon className="size-5 text-primary" />
        New venue
      </h2>
      <Collapse open={Boolean(notice)}>
        {notice && (
          <Banner kind={notice.kind} title={notice.title}>
            {notice.text}
          </Banner>
        )}
      </Collapse>
      <VenueFields
        idPrefix="new"
        value={form.draft}
        onChange={form.change}
        errors={form.errors}
        warnings={{
          name: duplicate
            ? `You already have a venue with this name in ${duplicate.city}.`
            : undefined,
        }}
        onLeave={form.leave}
        now={now}
        suggest
      />
      <div className="flex justify-end gap-2">
        <Button variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={create.isPending}
          aria-busy={create.isPending}
        >
          {create.isPending ? (
            <>
              <Spinner />
              Adding
            </>
          ) : (
            "Add venue"
          )}
        </Button>
      </div>
    </form>
  );
}

function VenueRow({
  venue,
  venues,
  index,
  now,
}: {
  venue: VenueWithEvents;
  venues: VenueWithEvents[];
  index: number;
  now: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const remove = useDeleteVenue();
  const queryClient = useQueryClient();
  const upcoming = venue.events.filter((event) => !event.past).length;
  const panelId = `venue-${venue.id}`;

  function deleteVenue() {
    const { name, address, city, country, timezone } = venue;
    remove.mutate(venue.id, {
      onSuccess: () =>
        showSnackbar("Venue deleted.", {
          kind: "deleted",
          action: {
            label: "Undo",
            onAction: () =>
              restoreVenue(queryClient, {
                name,
                address,
                city,
                country,
                timezone,
              })
                .then(() => showSnackbar("Venue restored."))
                .catch(() =>
                  showSnackbar("Couldn't restore the venue.", {
                    kind: "error",
                  }),
                ),
          },
        }),
      onError: (error) =>
        showSnackbar(
          error instanceof ApiError && error.code === "venue_in_use"
            ? "Events use this venue now, so it was kept."
            : "Couldn't delete the venue. Try again.",
          { kind: "error" },
        ),
    });
  }

  return (
    <li
      // Each row rises in on its own layer; while focus is inside (its menu open), it sits on top.
      className="relative animate-rise rounded-lg bg-surface-container-low focus-within:z-10 motion-reduce:animate-fade"
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open);
          if (open) setEditing(false);
        }}
        className="group grid w-full cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)_1.5rem] items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3.5 text-left hover:bg-on-surface/4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_1.5rem]"
      >
        <span className="grid size-10 place-items-center rounded-md bg-secondary-container text-on-secondary-container">
          <PlaceIcon className="size-5.5" />
        </span>
        <span className="grid min-w-0">
          <span className="truncate text-title-md text-on-surface">
            {venue.name}
          </span>
          <span className="truncate text-body-md text-on-surface-variant">
            {venue.address}, {venue.city}, {venue.country}
          </span>
        </span>
        <span className="col-start-2 row-start-2 flex flex-wrap gap-2 sm:col-start-3 sm:row-start-1 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-surface-container-highest px-2.5 py-1 text-label-md whitespace-nowrap text-on-surface-variant tabular-nums">
            <ScheduleIcon className="size-3.5" />
            {now !== null && (
              <span>
                {new Intl.DateTimeFormat("en-GB", {
                  timeZone: venue.timezone,
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                }).format(now)}{" "}
              </span>
            )}
            {zoneCity(venue.timezone)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-label-md whitespace-nowrap ${upcoming ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-on-surface-variant"}`}
          >
            <EventsIcon className="size-3.5" />
            {upcoming
              ? `${upcoming} to come`
              : venue.events.length
                ? "None to come"
                : "No events"}
          </span>
        </span>
        <ArrowDownIcon className="col-start-3 row-start-1 size-6 text-on-surface-variant transition-transform duration-200 group-aria-expanded:rotate-180 motion-reduce:transition-none sm:col-start-4" />
      </button>

      <Collapse open={open}>
        <div id={panelId} className="px-4 pb-4 sm:pl-18">
          {editing ? (
            <EditVenue
              venue={venue}
              venues={venues}
              onDone={() => {
                setEditing(false);
                setTimeout(() =>
                  document.getElementById(`${panelId}-edit`)?.focus(),
                );
              }}
            />
          ) : (
            <div className="flex animate-fade flex-col gap-3 motion-reduce:animate-none">
              <h3 className="text-label-lg text-on-surface-variant">
                {venue.events.length ? "Events here" : "Events"}
              </h3>
              {venue.events.length ? (
                <ul className="flex flex-col border-t border-outline-variant">
                  {venue.events.map((event) => (
                    <li
                      key={event.id}
                      className="border-b border-outline-variant"
                    >
                      <Link
                        href={`/events/${event.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 hover:bg-on-surface/4 focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <span className="grid min-w-0">
                          <span
                            className={`truncate text-body-lg ${event.past ? "text-on-surface-variant" : "text-on-surface"}`}
                          >
                            {event.title}
                          </span>
                          <span className="text-body-md text-on-surface-variant tabular-nums">
                            {formatEventDate(event.startsAt, venue.timezone)}
                          </span>
                        </span>
                        <StatusChip status={event.status} past={event.past} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-md text-on-surface-variant">
                  No events use this venue yet. It is in the venue menu when you
                  create one.
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  id={`${panelId}-edit`}
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setTimeout(() =>
                      document.getElementById(`edit-${venue.id}-name`)?.focus(),
                    );
                  }}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-outline pr-6 pl-4 text-label-lg text-primary hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-sm:flex-1 max-sm:justify-center"
                >
                  <EditIcon className="size-5" />
                  Edit venue
                </button>
                <OverflowMenu
                  label={`More actions for ${venue.name}`}
                  items={[
                    venue.events.length
                      ? {
                          label: "Delete",
                          icon: DeleteIcon,
                          disabled: true,
                          description: upcoming
                            ? `Used by ${upcoming === 1 ? "1 event" : `${upcoming} events`} to come. Move or delete ${upcoming === 1 ? "it" : "them"} first.`
                            : "Past events still point to it.",
                          onSelect: () => {},
                        }
                      : {
                          label: "Delete venue",
                          icon: DeleteIcon,
                          danger: true,
                          onSelect: deleteVenue,
                        },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </Collapse>
    </li>
  );
}

function EditVenue({
  venue,
  venues,
  onDone,
}: {
  venue: VenueWithEvents;
  venues: VenueWithEvents[];
  onDone: () => void;
}) {
  const formId = `edit-${venue.id}`;
  const form = useVenueForm({ ...venue, zoneChosen: true }, formId);
  const update = useUpdateVenue(venue.id);
  const [notice, setNotice] = useState<Notice | null>(null);
  const now = useNow();
  const impact = venueChangeImpact(venue, form.input as Required<VenueInput>);
  const duplicate = duplicateOf(venues, form.draft, venue.id);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (update.isPending || !form.check()) return;
    setNotice(null);
    update.mutate(form.input, {
      onSuccess: () => {
        showSnackbar("Venue saved.");
        onDone();
      },
      onError: (error) => {
        if (error instanceof ApiError && Object.keys(error.fields).length)
          return form.showServerErrors(error.fields);
        setNotice(noticeFor(error));
      },
    });
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      noValidate
      className="flex animate-fade flex-col gap-4 pt-1 [--field-bg:var(--color-surface-container-low)] motion-reduce:animate-none"
    >
      <Collapse open={Boolean(notice)}>
        {notice && (
          <Banner kind={notice.kind} title={notice.title}>
            {notice.text}
          </Banner>
        )}
      </Collapse>
      <VenueFields
        idPrefix={formId}
        value={form.draft}
        onChange={form.change}
        errors={form.errors}
        warnings={{
          name: duplicate
            ? `You already have a venue with this name in ${duplicate.city}.`
            : undefined,
        }}
        onLeave={form.leave}
        now={now}
        suggest={false}
      />
      <Collapse open={impact.length > 0}>
        <div
          role="status"
          className="flex flex-col gap-1 rounded-md bg-secondary-container px-4 py-3 text-body-md text-on-secondary-container"
        >
          {impact.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </Collapse>
      <div className="flex justify-end gap-2">
        <Button variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={update.isPending}
          aria-busy={update.isPending}
        >
          {update.isPending ? (
            <>
              <Spinner />
              Saving
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}
