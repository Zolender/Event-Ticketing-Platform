"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorIcon } from "@/components/ui/icons";

// Next renders this when a page inside the app fails unexpectedly; the header and rail stay.
// `retry` fetches the page's data again (stable since Next 16.3), unlike `reset`.
export default function AppError({
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <EmptyState
      icon={ErrorIcon}
      tone="error"
      title="Something went wrong"
      action={<Button onClick={() => retry()}>Try again</Button>}
    >
      This page couldn&apos;t load. Try again, and if it keeps happening, come
      back in a few minutes.
    </EmptyState>
  );
}
