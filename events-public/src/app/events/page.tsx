import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { PAGE } from "@/components/site-shell";
import { EventsBrowser } from "@/features/events/components/events-browser";
import { upcomingEventsQuery } from "@/features/events/queries";
import { normaliseSearch } from "@/features/events/search";
import { listUpcoming } from "@/features/events/server/events";
import { makeQueryClient } from "@/lib/query-client";

function searchFrom(q: string | string[] | undefined) {
  return normaliseSearch(Array.isArray(q) ? q[0] : q);
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/events">): Promise<Metadata> {
  const search = searchFrom((await searchParams).q);
  // Search results are endless variations of this page: the list itself is what gets indexed.
  return search
    ? {
        title: `Events matching “${search}”`,
        alternates: { canonical: "/events" },
        robots: { index: false, follow: true },
      }
    : {
        title: "Upcoming events",
        description:
          "Every upcoming event on Tiketi, soonest first, with times on each venue's own clock.",
        alternates: { canonical: "/events" },
      };
}

// The first page comes from the data access layer directly (no request to our own API) into the
// cache the browser takes over, so the HTML already lists events for crawlers and first paint.
export default async function EventsPage({
  searchParams,
}: PageProps<"/events">) {
  const search = searchFrom((await searchParams).q);
  const queryClient = makeQueryClient();
  await queryClient.prefetchInfiniteQuery({
    ...upcomingEventsQuery(search),
    queryFn: () => listUpcoming({ search }),
  });

  return (
    <div className={`${PAGE} flex flex-col gap-6 py-8`}>
      <div className="flex animate-rise flex-col gap-1 motion-reduce:animate-fade">
        <h1 className="text-headline-lg sm:text-display-sm">Upcoming events</h1>
        <p className="text-body-lg text-on-surface-variant">
          Soonest first. Each time is the venue&apos;s own.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EventsBrowser key={search ?? ""} initialSearch={search} />
      </HydrationBoundary>
    </div>
  );
}
