import type { Metadata } from "next";
import Link from "next/link";
import { PAGE } from "@/components/site-shell";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CalendarIcon,
  ChevronRightIcon,
  PlaceIcon,
  ScheduleIcon,
  ShareIcon,
  TicketIcon,
} from "@/components/ui/icons";
import { EventCard } from "@/features/events/components/event-card";
import {
  Countdown,
  LocalTimeNow,
} from "@/features/events/components/visitor-time";
import {
  formatFromPrice,
  formatTime,
  stubDate,
  zoneCity,
} from "@/features/events/format";
import {
  getPublishedEvent,
  listUpcoming,
  upcomingSummary,
} from "@/features/events/server/events";
import type { EventDetail } from "@/features/events/types";
import { organiserUrl } from "@/server/env";

// Made once and served cached; refreshed when an event changes, and every five minutes so
// "Next up" moves on by itself.
export const revalidate = 300;

export const metadata: Metadata = { alternates: { canonical: "/" } };

const FACTS = [
  {
    icon: ScheduleIcon,
    title: "Times on the venue's clock, and yours",
    text: "Every time is the venue's local time. Abroad, you also see it in yours.",
  },
  {
    icon: TicketIcon,
    title: "Every ticket price up front",
    text: "Each event lists its tiers, prices and places before you go.",
  },
  {
    icon: ShareIcon,
    title: "Share a link that looks right",
    text: "A shared event shows its title, date and place in any chat.",
  },
];

// The city cards fill their row whatever the number of cities.
const CITY_COLUMNS: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

// Sections appear only when they have something to show: with one event there is no "Coming
// up", with one city or one month no chips, and "See all" only when the page does not show
// everything.
export default async function Home() {
  const [{ events, nextCursor }, summary] = await Promise.all([
    listUpcoming({ limit: 7 }),
    upcomingSummary(),
  ]);
  const next = events[0] ? await getPublishedEvent(events[0].publicId) : null;
  const comingUp = events.slice(1);

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-surface-container-low to-surface">
        <div
          className={`${PAGE} grid items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:py-20`}
        >
          <div className="flex animate-rise flex-col items-start gap-6 motion-reduce:animate-fade">
            <h1 className="text-display-sm text-balance sm:text-display-lg">
              Events in Kigali and beyond
            </h1>
            <p className="max-w-[34ch] text-body-lg text-on-surface-variant sm:text-title-lg sm:font-normal">
              Concerts, talks, fairs and nights out, with every time on the
              venue&apos;s own clock.
            </p>
            <Link
              href="/events"
              className={buttonClass("filled", "h-12 px-8 text-title-sm")}
            >
              Browse events
            </Link>
            {summary.events > 0 && (
              <dl className="flex flex-wrap gap-x-8 gap-y-2">
                {[
                  [summary.events, "events coming up"],
                  [summary.venues, summary.venues === 1 ? "venue" : "venues"],
                  [
                    summary.cities.length,
                    summary.cities.length === 1 ? "city" : "cities",
                  ],
                ].map(([count, label]) => (
                  <div key={label} className="flex flex-col-reverse">
                    <dt className="text-body-md text-on-surface-variant">
                      {label}
                    </dt>
                    <dd className="text-headline-lg">{count}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {next ? (
            <TicketStack next={next} behind={Math.min(comingUp.length, 2)} />
          ) : (
            <div className="rounded-xl bg-surface-container-low">
              <EmptyState icon={CalendarIcon} title="No events coming up yet">
                Check back soon: new events appear as organisers publish them.
              </EmptyState>
            </div>
          )}
        </div>
      </section>

      <div className={`${PAGE} flex flex-col gap-14 py-14`}>
        {summary.cities.length > 1 && (
          <section aria-labelledby="cities" className="flex flex-col gap-4">
            <h2 id="cities" className="text-headline-md">
              Browse by city
            </h2>
            <ul
              className={`grid gap-4 ${CITY_COLUMNS[Math.min(summary.cities.length, 4)]}`}
            >
              {summary.cities.map((city, index) => (
                <li key={city.name}>
                  <Link
                    href={`/events?q=${encodeURIComponent(city.name)}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="group relative flex h-full min-h-40 animate-rise flex-col justify-between gap-4 overflow-hidden rounded-xl bg-secondary-container p-6 text-on-secondary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:animate-fade"
                  >
                    {/* A ring, drawn only to give the card some shape. */}
                    <span
                      aria-hidden="true"
                      className="absolute -top-10 -right-10 size-40 rounded-full border-[18px] border-current opacity-8 transition-transform duration-500 ease-emphasized-decelerate group-hover:scale-110 motion-reduce:transition-none"
                    />
                    <span className="flex min-h-5 items-center gap-1.5 text-label-lg">
                      <ScheduleIcon className="size-4.5" />
                      <LocalTimeNow
                        timeZone={city.timeZone}
                        after=" there now"
                      />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-headline-lg text-on-surface">
                        {city.name}
                      </span>
                      <span className="text-body-lg">
                        {plural(city.count, "event")} coming up
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {comingUp.length > 0 && (
          <section aria-labelledby="coming-up" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="coming-up" className="text-headline-md">
                Coming up
              </h2>
              {nextCursor && (
                <Link
                  href="/events"
                  className={buttonClass("text", "-mr-3 px-3")}
                >
                  See all {summary.events} events
                  <ChevronRightIcon className="size-4.5" />
                </Link>
              )}
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {comingUp.map((event, index) => (
                <li key={event.publicId}>
                  <EventCard event={event} index={index} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {summary.months.length > 1 && (
          <section aria-labelledby="months" className="flex flex-col gap-4">
            <h2 id="months" className="text-headline-md">
              Browse by month
            </h2>
            <ul className="flex flex-wrap gap-3">
              {summary.months.map((month) => (
                <li key={month.label}>
                  <Link
                    href="/events"
                    className="relative flex min-w-44 flex-col overflow-hidden rounded-md border border-outline-variant px-5 py-3 before:absolute before:inset-0 before:bg-on-surface before:opacity-0 before:transition-opacity hover:before:opacity-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="text-title-md">{month.label}</span>
                    <span className="text-body-md text-on-surface-variant">
                      {plural(month.count, "event")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ul aria-label="Why Tiketi" className="grid gap-8 md:grid-cols-3">
          {FACTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2">
              <span className="mb-1 grid size-16 place-items-center rounded-[20px] bg-secondary-container text-on-secondary-container">
                <Icon className="size-8" />
              </span>
              <span className="text-title-lg">{title}</span>
              <span className="text-body-lg text-on-surface-variant">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <section className="bg-primary-container text-on-primary-container">
        <div
          className={`${PAGE} flex flex-wrap items-center justify-between gap-6 py-12`}
        >
          <p className="flex flex-col gap-1">
            <span className="text-headline-lg">Hosting events?</span>
            <span className="text-title-lg font-normal">
              Publish them on Tiketi and share one link.
            </span>
          </p>
          <a
            href={organiserUrl()}
            className={buttonClass("on-container", "h-12 px-8 text-title-sm")}
          >
            Sign in for organisers
          </a>
        </div>
      </section>
    </div>
  );
}

/**
 * The next event as the big ticket, with the shapes of the ones after it fanned behind; they
 * spread a little on hover. The shapes carry no text, so nothing is read twice.
 */
function TicketStack({ next, behind }: { next: EventDetail; behind: number }) {
  return (
    <div className="group grid animate-rise [animation-delay:100ms] motion-reduce:animate-fade">
      {behind >= 2 && (
        <TicketShape className="hidden translate-x-8 -translate-y-7 scale-94 rotate-5 opacity-80 group-hover:translate-x-16 group-hover:-translate-y-12 group-hover:rotate-8 sm:grid" />
      )}
      {behind >= 1 && (
        <TicketShape className="hidden translate-x-4 -translate-y-3.5 scale-97 rotate-[2.5deg] opacity-95 group-hover:translate-x-8 group-hover:-translate-y-6 group-hover:rotate-4 sm:grid" />
      )}
      <NextUp event={next} />
    </div>
  );
}

function TicketShape({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`[grid-area:1/1] grid-cols-[minmax(0,1fr)_13rem] rounded-xl ticket-notches transition-transform duration-500 ease-emphasized-decelerate [--cut:calc(100%-13rem)] [--notch:16px] motion-reduce:transition-none ${className}`}
    >
      <span className="bg-surface-container-high" />
      <span className="border-l-[3px] border-dashed border-on-primary-container/45 bg-primary-container" />
    </div>
  );
}

function NextUp({ event }: { event: EventDetail }) {
  const date = stubDate(event.startsAt, event.timeZone);
  return (
    <div className="relative grid overflow-hidden rounded-xl shadow-lg [grid-area:1/1] sm:grid-cols-[minmax(0,1fr)_13rem] sm:ticket-notches sm:[--cut:calc(100%-13rem)] sm:[--notch:16px]">
      <div className="flex min-w-0 flex-col gap-5 bg-surface p-6 sm:p-8">
        <p className="text-label-md tracking-wider text-primary uppercase">
          Next up
        </p>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-headline-lg break-words">{event.title}</h2>
          <p className="text-body-lg">
            by{" "}
            <span className="font-medium text-primary">
              {event.organiserName}
            </span>
          </p>
        </div>
        <p className="flex gap-3">
          <PlaceIcon className="mt-0.5 size-[22px]" />
          <span>
            {event.venueName}
            <span className="block text-body-md text-on-surface-variant">
              {event.city}, {event.country}
            </span>
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Countdown startsAt={event.startsAt} timeZone={event.timeZone} />
          <Link href={event.path} className={buttonClass("tonal")}>
            See details
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-center gap-8 border-t-[3px] border-dashed border-on-primary-container/45 bg-primary-container p-6 text-on-primary-container sm:flex-col sm:gap-4 sm:border-t-0 sm:border-l-[3px] sm:text-center">
        <span className="flex flex-col items-center gap-1.5 leading-none">
          <span className="text-label-lg tracking-widest uppercase">
            {date.weekday}
          </span>
          <span className="text-[64px] leading-none">{date.day}</span>
          <span className="text-label-lg tracking-widest uppercase">
            {date.monthYear}
          </span>
        </span>
        <span className="flex flex-col gap-1.5 sm:items-center">
          <span className="text-headline-sm">
            {formatTime(event.startsAt, event.timeZone)}
          </span>
          <span className="text-body-sm">{zoneCity(event.timeZone)} time</span>
          {event.prices && (
            <span className="text-title-md">
              {formatFromPrice(event.prices, event.currency)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
