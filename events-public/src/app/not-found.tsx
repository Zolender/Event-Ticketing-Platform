import type { Metadata } from "next";
import Link from "next/link";
import { PAGE } from "@/components/site-shell";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EventBusyIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Page not found" };

// One page for every address that leads nowhere: an unknown event, a draft and a mistyped link
// all look the same, so nothing reveals that a draft exists. Next answers it with status 404.
export default function NotFound() {
  return (
    <div className={`${PAGE} pt-8`}>
      <EmptyState
        as="h1"
        icon={EventBusyIcon}
        title="This page isn't here"
        action={
          <Link href="/events" className={buttonClass("filled")}>
            See upcoming events
          </Link>
        }
      >
        The link may be wrong, or the event is no longer published.
      </EmptyState>
    </div>
  );
}
