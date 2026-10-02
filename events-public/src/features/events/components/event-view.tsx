import Link from "next/link";
import { PAGE } from "@/components/site-shell";
import { Banner } from "@/components/ui/banner";
import { buttonClass } from "@/components/ui/button";
import {
  CalendarIcon,
  ChevronRightIcon,
  PlaceIcon,
} from "@/components/ui/icons";
import {
  formatDateTime,
  formatFromPrice,
  formatPrice,
  formatTime,
  isoWithOffset,
  stubDate,
  zoneCity,
  zoneOffset,
} from "../format";
import type { EventCard as Card, EventDetail } from "../types";
import { EventCard } from "./event-card";
import { ShareButton } from "./share-button";
import { Countdown, YourTime } from "./visitor-time";

/** The public event page: the ticket, then about, where and tickets, then more events. */
export function EventView({
  event,
  more,
}: {
  event: EventDetail;
  more: Card[];
}) {
  const { timeZone } = event;
  const date = stubDate(event.startsAt, timeZone);
  const places = event.tiers.reduce((sum, tier) => sum + tier.capacity, 0);

  return (
    <article className={`${PAGE} flex flex-col gap-8 py-6 sm:py-8`}>
      <div className="flex animate-rise flex-col gap-4 motion-reduce:animate-fade">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-1 text-label-lg text-on-surface-variant">
            <li>
              <Link href="/events" className="rounded-xs hover:underline">
                Events
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-[18px]" />
            </li>
            <li aria-current="page" className="truncate text-on-surface">
              {event.title}
            </li>
          </ol>
        </nav>

        {/* The ticket: details, then the date on a navy stub behind a notched perforation. */}
        <div className="grid overflow-hidden rounded-xl sm:grid-cols-[minmax(0,1fr)_13.75rem] sm:ticket-notches sm:[--cut:calc(100%-13.75rem)] sm:[--notch:14px]">
          <div className="flex min-w-0 flex-col gap-5 bg-surface-container-low p-5 sm:p-8">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-headline-lg text-balance break-words sm:text-display-md">
                {event.title}
              </h1>
              <p className="text-body-lg">
                by{" "}
                <span className="font-medium text-primary">
                  {event.organiserName}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="flex gap-3">
                <CalendarIcon className="mt-0.5 size-[22px]" />
                <span>
                  <time dateTime={isoWithOffset(event.startsAt, timeZone)}>
                    {formatDateTime(event.startsAt, timeZone)}
                  </time>
                  <span className="block text-body-md text-on-surface-variant">
                    {zoneCity(timeZone)} time
                    <YourTime startsAt={event.startsAt} timeZone={timeZone} />
                  </span>
                </span>
              </p>
              <p className="flex gap-3">
                <PlaceIcon className="mt-0.5 size-[22px]" />
                <span>
                  {event.venueName}
                  <span className="block text-body-md text-on-surface-variant">
                    {event.city}, {event.country}
                  </span>
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Countdown startsAt={event.startsAt} timeZone={timeZone} />
              <ShareButton path={event.path} title={event.title} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-8 border-t-[3px] border-dashed border-on-primary-container/45 bg-primary-container p-5 text-on-primary-container sm:flex-col sm:gap-3.5 sm:border-t-0 sm:border-l-[3px] sm:text-center">
            <span
              aria-hidden="true"
              className="flex flex-col items-center gap-1 leading-none"
            >
              <span className="text-label-lg tracking-widest uppercase">
                {date.weekday}
              </span>
              <span className="text-display-lg">{date.day}</span>
              <span className="text-label-lg tracking-widest uppercase">
                {date.monthYear}
              </span>
            </span>
            <span className="flex flex-col gap-2 sm:items-center">
              <span aria-hidden="true" className="text-title-lg">
                {formatTime(event.startsAt, timeZone)}
              </span>
              {!event.past && event.prices && (
                <span className="flex flex-col">
                  <span className="text-label-md">Tickets</span>
                  <span className="text-title-lg">
                    {formatFromPrice(event.prices, event.currency)}
                  </span>
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {event.past && (
        <Banner
          kind="info"
          title="This event has ended."
          action={
            <Link href="/events" className={buttonClass("text", "px-3")}>
              See what&apos;s on next
            </Link>
          }
        >
          Its page stays here so shared links keep working.
        </Banner>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="about" className="flex flex-col gap-3">
            <h2 id="about" className="text-title-lg">
              About
            </h2>
            <p className="max-w-prose text-body-lg tracking-[0.5px] break-words whitespace-pre-line">
              {event.description}
            </p>
          </section>
          <section aria-labelledby="where" className="flex flex-col gap-3">
            <h2 id="where" className="text-title-lg">
              Where
            </h2>
            <address className="flex flex-col text-body-lg not-italic">
              <span>{event.venueName}</span>
              <span>{event.venueAddress}</span>
              <span>
                {event.city}, {event.country}
              </span>
              <span className="mt-1 text-body-md text-on-surface-variant">
                Times on this page are {zoneCity(timeZone)} time (UTC
                {zoneOffset(event.startsAt, timeZone)}).
              </span>
            </address>
          </section>
        </div>

        {!event.past && event.tiers.length > 0 && (
          <aside
            aria-labelledby="tickets"
            className="order-first flex flex-col gap-3 rounded-md bg-surface-container-low p-4 lg:sticky lg:top-20 lg:order-none"
          >
            <h2 id="tickets" className="text-title-md">
              Tickets
            </h2>
            <ul className="flex flex-col gap-2">
              {event.tiers.map((tier, index) => (
                <li
                  key={`${tier.name}-${index}`}
                  style={{ animationDelay: `${(index + 2) * 30}ms` }}
                  className="grid animate-rise grid-cols-[minmax(0,1fr)_8.25rem] rounded-md ticket-notches [--cut:calc(100%-8.25rem)] motion-reduce:animate-fade"
                >
                  <span className="flex flex-col justify-center bg-surface-container-high px-4 py-3">
                    <span className="text-title-md break-words">
                      {tier.name}
                    </span>
                    <span className="text-body-md text-on-surface-variant tabular-nums">
                      {tier.capacity} {tier.capacity === 1 ? "place" : "places"}
                    </span>
                  </span>
                  <span className="flex items-center justify-end border-l-2 border-dashed border-outline-variant bg-surface-container-high px-4 py-3 text-right text-title-md text-primary tabular-nums">
                    {formatPrice(tier.price, event.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between px-1 text-body-md text-on-surface-variant tabular-nums">
              <span>Total</span>
              <span className="font-medium text-on-surface">
                {places} {places === 1 ? "place" : "places"}
              </span>
            </p>
          </aside>
        )}
      </div>

      {more.length > 0 && (
        <section aria-labelledby="more" className="flex flex-col gap-3">
          <h2 id="more" className="text-title-lg">
            {event.past ? "What's on next" : "More events"}
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {more.map((card, index) => (
              <li key={card.publicId}>
                <EventCard event={card} index={index} />
              </li>
            ))}
          </ul>
          <Link
            href="/events"
            className={buttonClass("text", "-ml-3 self-start px-3")}
          >
            See all events
            <ChevronRightIcon className="size-[18px]" />
          </Link>
        </section>
      )}
    </article>
  );
}
