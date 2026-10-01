"use client";

import { PAGE } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorIcon } from "@/components/ui/icons";

// Only seen when a page was never cached and its data cannot be read: once a page has rendered,
// visitors get that copy while a fresh one is made. `retry` fetches the page's data again.
export default function SiteError({
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <div className={`${PAGE} pt-8`}>
      <EmptyState
        as="h1"
        icon={ErrorIcon}
        title="Couldn't load events"
        action={<Button onClick={() => retry()}>Try again</Button>}
      >
        Something went wrong on our side. Try again in a moment.
      </EmptyState>
    </div>
  );
}
