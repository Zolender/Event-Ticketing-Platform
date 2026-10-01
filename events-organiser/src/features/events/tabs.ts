import type { EventSummary } from "./types";

export const tabs = ["published", "drafts", "past"] as const;
export type Tab = (typeof tabs)[number];

export const tabLabels: Record<Tab, string> = {
  published: "Published",
  drafts: "Drafts",
  past: "Past",
};

export function parseTab(value: string | null | undefined): Tab {
  return tabs.find((tab) => tab === value) ?? "published";
}

/** Past wins over status: a draft whose date has gone has nothing left to publish. */
export function tabOf(event: EventSummary): Tab {
  if (event.past) return "past";
  return event.status === "published" ? "published" : "drafts";
}

/** Published and Drafts: soonest first. Past: most recent first. Input is sorted by start. */
export function groupByTab(
  events: EventSummary[],
): Record<Tab, EventSummary[]> {
  const groups: Record<Tab, EventSummary[]> = {
    published: [],
    drafts: [],
    past: [],
  };
  for (const event of events) groups[tabOf(event)].push(event);
  groups.past.reverse();
  return groups;
}
