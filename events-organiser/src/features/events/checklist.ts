import type { EventDetail } from "./types";

// What publishing needs, in the database's own rules (a description, a date to come, at least one
// tier; the title and venue are required from the first save). Shown before publishing, so the
// organiser sees what is missing instead of meeting a refusal.

export type ChecklistItem = {
  key: "title" | "description" | "date" | "tiers";
  label: string;
  done: boolean;
  /** Where the form fixes it. */
  section: "details" | "when" | "tickets";
};

export function publishChecklist(event: EventDetail): ChecklistItem[] {
  return [
    {
      key: "title",
      label: "A title and a venue",
      done: true,
      section: "details",
    },
    {
      key: "description",
      label: "A description",
      done: Boolean(event.description?.trim()),
      section: "details",
    },
    {
      key: "date",
      label: "A date to come",
      done: !event.past,
      section: "when",
    },
    {
      key: "tiers",
      label: "At least one ticket tier",
      done: event.tiers.length > 0,
      section: "tickets",
    },
  ];
}

/** "a description and at least one ticket tier", for the refusal banner. */
export function missingText(items: ChecklistItem[]) {
  const missing = items
    .filter((item) => !item.done)
    .map((item) => item.label.charAt(0).toLowerCase() + item.label.slice(1));
  if (missing.length <= 1) return missing[0] ?? "";
  return `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`;
}
