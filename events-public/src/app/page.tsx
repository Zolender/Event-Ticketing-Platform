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
import { Countdown } from "@/features/events/components/visitor-time";
import {
  formatFromPrice,
  formatTime,
  stubDate,
  zoneCity,
} from "@/features/events/format";
import {
  getPublishedEvent,
  listUpcoming,
  upcomingMonths,
} from "@/features/events/server/events";
import { organiserUrl } from "@/server/env";

// Made once and served cached; refreshed every five minutes so "Next up" moves on by itself.
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

// Sections appear only when they have something to show: with one event there is no "Coming
// up", with one month no month chips, and "See all" only when the page does not show everything.
export default async function Home() {
  const [{ events, nextCursor }, months] = await Promise.all([
    listUpcoming({ limit: 7 }),
    upcomingMonths(),
  ]);
  const next = events[0] ? await getPublishedEvent(events[0].publicId) : null;
  const comingUp = events.slice(1);

  return (
    <div className="flex flex-col gap-10 pb-10">
      <section className="bg-surface-container-low">
        <div
          className={`${PAGE} grid animate-rise items-center gap-8 py-10 motion-reduce:animate-fade lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]`}
        >
          <div className="flex flex-col items-start gap-4">
            <h1 className="text-display-sm text-balance sm:text-display-md">
              Events in Kigali and beyond
            </h1>
            <p className="max-w-[44ch] text-body-lg text-on-surface-variant">
              Concerts, talks, fairs and nights out, with every time on the
              venue&apos;s own clock.
            </p>
            <Link href="/events" className={buttonClass("filled")}>
              Browse events
            </Link>
          </div>
          {next ? (
            <div className="grid overflow-hidden rounded-xl sm:grid-cols-[minmax(0,1fr)_10.5rem] sm:ticket-notches sm:[--cut:calc(100%-10.5rem)] sm:[--notch:12px]">
              <div className="flex min-w-0 flex-col gap-4 bg-surface p-5 sm:p-6">
                <p className="text-label-md tracking-wider text-primary uppercase">
                  Next up
                </p>
                <div className="flex flex-col gap-1">
                  <h2 className="text-headline-md break-words">{next.title}</h2>
                  <p className="text-body-lg">
                    by{" "}
                    <span className="font-medium text-primary">
                      {next.organiserName}
                    </span>
                  </p>
                </div>
                <p className="flex gap-3">
                  <PlaceIcon className="mt-0.5 size-[22px]" />
                  <span>
                    {next.venueName}
                    <span className="block text-body-md text-on-surface-variant">
                      {next.city}, {next.country}
                    </span>
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Countdown
                    startsAt={next.startsAt}
                    timeZone={next.timeZone}
                  />
                  <Link href={next.path} className={buttonClass("tonal")}>
                    See details
                  </Link>
                </div>
              </div>
              <NextUpStub event={next} />
            </div>
          ) : (
            <div className="rounded-xl bg-surface">
              <EmptyState icon={CalendarIcon} title="No events coming up yet">
                Check back soon: new events appear as organisers publish them.
              </EmptyState>
            </div>
          )}
        </div>
      </section>

      <div className={`${PAGE} flex flex-col gap-10`}>
        {months.length > 1 && (
          <section aria-labelledby="months" className="flex flex-col gap-3">
            <h2 id="months" className="text-title-lg">
              Browse by month
            </h2>
            <ul className="flex flex-wrap gap-2">
              {months.map((month) => (
                <li key={month.label}>
                  <Link
                    href="/events"
                    className="relative flex min-w-38 flex-col overflow-hidden rounded-sm border border-outline-variant px-4 py-2.5 before:absolute before:inset-0 before:bg-on-surface before:opacity-0 before:transition-opacity hover:before:opacity-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="text-title-sm">{month.label}</span>
                    <span className="text-body-sm text-on-surface-variant">
                      {month.count} {month.count === 1 ? "event" : "events"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {comingUp.length > 0 && (
          <section aria-labelledby="coming-up" className="flex flex-col gap-3">
            <h2 id="coming-up" className="text-title-lg">
              Coming up
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comingUp.map((event, index) => (
                <li key={event.publicId}>
                  <EventCard event={event} index={index} />
                </li>
              ))}
            </ul>
            {nextCursor && (
              <Link
                href="/events"
                className={buttonClass("text", "-ml-3 self-start px-3")}
              >
                See all events
                <ChevronRightIcon className="size-[18px]" />
              </Link>
            )}
          </section>
        )}

        <ul aria-label="Why Tiketi" className="grid gap-6 md:grid-cols-3">
          {FACTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-1.5">
              <span className="mb-1 grid size-14 place-items-center rounded-lg bg-secondary-container text-on-secondary-container">
                <Icon className="size-7" />
              </span>
              <span className="text-title-md">{title}</span>
              <span className="text-body-md text-on-surface-variant">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <section className="bg-primary-container text-on-primary-container">
        <div
          className={`${PAGE} flex flex-wrap items-center justify-between gap-4 py-7`}
        >
          <p className="flex flex-col">
            <span className="text-title-lg">Hosting events?</span>
            <span className="text-body-lg">
              Publish them on Tiketi and share one link.
            </span>
          </p>
          <a href={organiserUrl()} className={buttonClass("on-container")}>
            Sign in for organisers
          </a>
        </div>
      </section>
    </div>
  );
}

function NextUpStub({
  event,
}: {
  event: NonNullable<Awaited<ReturnType<typeof getPublishedEvent>>>;
}) {
  const date = stubDate(event.startsAt, event.timeZone);
  return (
    <div className="flex items-center justify-center gap-8 border-t-[3px] border-dashed border-on-primary-container/45 bg-primary-container p-5 text-on-primary-container sm:flex-col sm:gap-3 sm:border-t-0 sm:border-l-[3px] sm:text-center">
      <span className="flex flex-col items-center gap-1 leading-none">
        <span className="text-label-lg tracking-widest uppercase">
          {date.weekday}
        </span>
        <span className="text-display-md">{date.day}</span>
        <span className="text-label-lg tracking-widest uppercase">
          {date.monthYear}
        </span>
      </span>
      <span className="flex flex-col gap-1.5 sm:items-center">
        <span className="text-title-lg">
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
  );
}
