"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BackIcon, PlaceIcon, ScheduleIcon } from "@/components/ui/icons";
import { formatEventDate, formatPrice, zoneLabel } from "../format";
import { myEventQuery } from "../queries";
import { StatusChip } from "./status-chip";

export function EventDetailView({ id }: { id: string }) {
  // Always present: the page prefetched it, and an unknown id never gets this far.
  const { data: event } = useQuery(myEventQuery(id));
  if (!event) return null;

  const timeZone = event.venue.timezone;

  return (
    <article className="flex flex-col gap-6">
      <Link
        href="/events"
        className="inline-flex w-fit items-center gap-2 rounded-full py-2 pr-4 pl-3 text-label-lg text-primary hover:bg-primary/8"
      >
        <BackIcon className="size-5" />
        Your events
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-headline-md">{event.title}</h1>
        <StatusChip status={event.status} past={event.past} />
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="flex gap-3 rounded-md bg-surface-container-low p-4">
          <ScheduleIcon className="size-6 shrink-0 text-on-surface-variant" />
          <div>
            <dt className="text-label-md text-on-surface-variant">When</dt>
            <dd className="text-body-lg">
              {formatEventDate(event.startsAt, timeZone)}
            </dd>
            <dd className="text-body-md text-on-surface-variant">
              {zoneLabel(timeZone)}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-md bg-surface-container-low p-4">
          <PlaceIcon className="size-6 shrink-0 text-on-surface-variant" />
          <div>
            <dt className="text-label-md text-on-surface-variant">Where</dt>
            <dd className="text-body-lg">{event.venue.name}</dd>
            <dd className="text-body-md text-on-surface-variant">
              {event.venue.address}, {event.venue.city}, {event.venue.country}
            </dd>
          </div>
        </div>
      </dl>

      <section aria-labelledby="about" className="flex flex-col gap-2">
        <h2 id="about" className="text-title-lg">
          About
        </h2>
        {event.description ? (
          <p className="max-w-prose text-body-lg whitespace-pre-line">
            {event.description}
          </p>
        ) : (
          <p className="text-body-lg text-on-surface-variant">
            No description yet. It is needed before publishing.
          </p>
        )}
      </section>

      <section aria-labelledby="tickets" className="flex flex-col gap-3">
        <h2 id="tickets" className="text-title-lg">
          Tickets
        </h2>
        {event.tiers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-md border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant text-label-lg text-on-surface-variant">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Tier
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Price
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Capacity
                  </th>
                </tr>
              </thead>
              <tbody className="text-body-lg">
                {event.tiers.map((tier) => (
                  <tr
                    key={tier.id}
                    className="border-b border-outline-variant/50"
                  >
                    <td className="py-3 pr-4">{tier.name}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatPrice(tier.price, event.currency)}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {tier.capacity.toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-body-lg text-on-surface-variant">
            No ticket tiers yet. At least one is needed before publishing.
          </p>
        )}
      </section>

      {event.firstPublishedAt && event.status === "draft" && (
        <p className="text-body-md text-on-surface-variant">
          This event was published on{" "}
          {formatEventDate(event.firstPublishedAt, timeZone)} and is now a draft
          again, so it can only be unpublished, never deleted.
        </p>
      )}
    </article>
  );
}
