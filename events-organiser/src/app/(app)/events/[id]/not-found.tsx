import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { BackIcon, EventsIcon } from "@/components/ui/icons";

// Shown for a missing event and for another organiser's event alike, so neither is revealed.
export default function EventNotFound() {
  return (
    <EmptyState
      icon={EventsIcon}
      title="We can't find this event"
      action={
        <Link
          href="/events"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 pr-6 text-label-lg text-on-primary"
        >
          <BackIcon className="size-5" />
          Your events
        </Link>
      }
    >
      It may have been deleted, or the link may be wrong.
    </EmptyState>
  );
}
