import type { EventStatus } from "../types";

/** Draft or published, and "Ended" for a published event whose date has passed. */
export function StatusChip({
  status,
  past,
}: {
  status: EventStatus;
  past: boolean;
}) {
  const ended = past && status === "published";
  const label = ended
    ? "Ended"
    : status === "published"
      ? "Published"
      : "Draft";
  const colours =
    status === "published" && !ended
      ? "bg-secondary-container text-on-secondary-container"
      : "bg-surface-container-highest text-on-surface-variant";
  return (
    <span
      className={`rounded-sm px-2.5 py-1 text-label-md whitespace-nowrap ${colours}`}
    >
      {label}
    </span>
  );
}
