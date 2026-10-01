"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/ui/collapse";
import { Dialog } from "@/components/ui/dialog";
import {
  AddIcon,
  BackIcon,
  DeleteIcon,
  DoneCircleIcon,
  EditIcon,
  LiveIcon,
  LockIcon,
  OpenInNewIcon,
  PlaceIcon,
  ScheduleIcon,
  TodoCircleIcon,
} from "@/components/ui/icons";
import { OverflowMenu } from "@/components/ui/overflow-menu";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/fetch-json";
import { showSnackbar } from "@/lib/snackbar";
import { missingText, publishChecklist } from "../checklist";
import { formatEventDate, formatPrice, zoneLabel } from "../format";
import { useDeleteEvent, useSetPublished } from "../mutations";
import { myEventQuery } from "../queries";
import type { EventDetail } from "../types";
import { StatusChip } from "./status-chip";

type Refusal = { title: string; text: string };

const refusals: Record<string, Refusal> = {
  needs_description: {
    title: "Not ready to publish",
    text: "It still needs a description.",
  },
  needs_tier: {
    title: "Not ready to publish",
    text: "It still needs at least one ticket tier.",
  },
  needs_future_date: {
    title: "Not ready to publish",
    text: "Its date has passed. Choose a date to come.",
  },
  offline: {
    title: "Can't reach Tiketi",
    text: "Check your connection, then try again.",
  },
  not_found: {
    title: "This event no longer exists",
    text: "It may have been deleted in another tab.",
  },
  unexpected: { title: "Something went wrong", text: "Try again in a moment." },
};

export function EventDetailView({ id }: { id: string }) {
  const router = useRouter();
  // Always present: the page prefetched it, and an unknown id never gets this far.
  const { data: event } = useQuery(myEventQuery(id));
  const setPublished = useSetPublished(id);
  const remove = useDeleteEvent(id);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [confirm, setConfirm] = useState<"unpublish" | "delete" | null>(null);
  if (!event) return null;

  const checklist = publishChecklist(event);
  const ready = checklist.every((item) => item.done);
  const live = event.status === "published" && !event.past;
  const busy = setPublished.isPending || remove.isPending;

  function fail(error: Error) {
    setRefusal(
      refusals[error instanceof ApiError ? error.code : "unexpected"] ??
        refusals.unexpected,
    );
  }

  function publish() {
    // What is visibly missing is said at once; the server still has the last word on the rest.
    if (!ready) {
      setRefusal({
        title: "Not ready to publish",
        text: `It still needs ${missingText(checklist)}. See the checklist.`,
      });
      return;
    }
    setRefusal(null);
    setPublished.mutate(true, {
      onSuccess: () => showSnackbar("Published. It's now on the public site."),
      onError: fail,
    });
  }

  function unpublish() {
    setConfirm(null);
    setRefusal(null);
    setPublished.mutate(false, {
      onSuccess: () =>
        showSnackbar("Unpublished. It's hidden from the public site."),
      onError: fail,
    });
  }

  function deleteDraft() {
    setConfirm(null);
    remove.mutate(undefined, {
      onSuccess: () => {
        showSnackbar("Draft deleted.");
        router.replace("/events?tab=drafts");
      },
      onError: fail,
    });
  }

  const timeZone = event.venue.timezone;
  const editLink = (section: string) => `/events/${id}/edit#${section}`;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link
          href="/events"
          aria-label="Back to your events"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container transition-colors hover:bg-secondary-container/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <BackIcon />
        </Link>
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-body-md text-on-surface-variant">Your events</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-headline-md">{event.title}</h1>
            <StatusChip status={event.status} past={event.past} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.status === "draft" && !event.past && (
            <Button
              onClick={publish}
              disabled={busy}
              aria-busy={setPublished.isPending}
            >
              {setPublished.isPending ? (
                <>
                  <Spinner />
                  Publishing
                </>
              ) : (
                "Publish"
              )}
            </Button>
          )}
          {event.status === "published" && (
            <Button
              variant="outlined"
              onClick={() => setConfirm("unpublish")}
              disabled={busy}
              aria-busy={setPublished.isPending}
            >
              {setPublished.isPending ? (
                <>
                  <Spinner />
                  Unpublishing
                </>
              ) : (
                "Unpublish"
              )}
            </Button>
          )}
          <Link
            href={`/events/${id}/edit`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-outline pr-6 pl-4 text-label-lg text-primary hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <EditIcon className="size-5" />
            Edit
          </Link>
          <OverflowMenu
            label="More actions"
            items={[
              event.firstPublishedAt
                ? {
                    label: "Delete",
                    icon: DeleteIcon,
                    disabled: true,
                    description:
                      event.status === "published"
                        ? "Published events can only be unpublished."
                        : "It was public before, so it can't be deleted.",
                    onSelect: () => {},
                  }
                : {
                    label: "Delete draft",
                    icon: DeleteIcon,
                    danger: true,
                    onSelect: () => setConfirm("delete"),
                  },
            ]}
          />
        </div>
      </header>

      <Collapse open={Boolean(refusal)}>
        {refusal && (
          <Banner kind="error" title={refusal.title}>
            {refusal.text}
          </Banner>
        )}
      </Collapse>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4 lg:order-0">
          <Card title="About">
            {event.description ? (
              <p className="max-w-prose text-body-lg whitespace-pre-line">
                {event.description}
              </p>
            ) : (
              <p className="text-body-lg text-on-surface-variant">
                No description yet.{" "}
                <AddLink href={editLink("details")}>Add a description</AddLink>
              </p>
            )}
          </Card>
          <Card title="Tickets">
            <Tickets event={event} />
            <div>
              <Link
                href={editLink("tickets")}
                className="inline-flex h-10 items-center gap-2 rounded-full pr-4 pl-3 text-label-lg text-primary hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <AddIcon className="size-5" />
                Add a tier
              </Link>
            </div>
          </Card>
        </div>

        <aside className="order-first flex min-w-0 flex-col gap-4 lg:order-0">
          <StatusCard event={event} live={live} />
          {event.status === "draft" && (
            <Card title="Before you publish">
              <ul className="flex flex-col gap-1">
                {checklist.map((item) => (
                  <li
                    key={item.key}
                    className="flex min-h-9 items-center gap-2.5 text-body-md"
                  >
                    {item.done ? (
                      <DoneCircleIcon className="size-5 shrink-0 text-primary" />
                    ) : (
                      <TodoCircleIcon className="size-5 shrink-0 text-on-surface-variant" />
                    )}
                    <span
                      className={
                        item.done
                          ? "text-on-surface-variant"
                          : "text-title-sm text-on-surface"
                      }
                    >
                      {item.label}
                    </span>
                    {!item.done && (
                      <Link
                        href={editLink(item.section)}
                        className="ml-auto rounded-sm px-1.5 py-1 text-label-lg text-primary underline underline-offset-3 hover:bg-primary/8"
                      >
                        {item.key === "date" ? "Change" : "Add"}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="When and where">
            <dl className="flex flex-col gap-3">
              <div className="flex gap-3">
                <ScheduleIcon className="size-6 shrink-0 text-on-surface-variant" />
                <div>
                  <dt className="sr-only">When</dt>
                  <dd className="text-body-lg">
                    {formatEventDate(event.startsAt, timeZone)}
                  </dd>
                  <dd className="text-body-md text-on-surface-variant">
                    {zoneLabel(timeZone)}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <PlaceIcon className="size-6 shrink-0 text-on-surface-variant" />
                <div>
                  <dt className="sr-only">Where</dt>
                  <dd className="text-body-lg">{event.venue.name}</dd>
                  <dd className="text-body-md text-on-surface-variant">
                    {event.venue.address}, {event.venue.city},{" "}
                    {event.venue.country}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>
        </aside>
      </div>

      <Dialog
        open={confirm === "unpublish"}
        onClose={() => setConfirm(null)}
        title="Unpublish this event?"
        actions={
          <>
            <Button variant="text" autoFocus onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="text" onClick={unpublish}>
              Unpublish
            </Button>
          </>
        }
      >
        It disappears from the public site, and links to it stop working until
        you publish it again.
      </Dialog>
      <Dialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        title="Delete this draft?"
        actions={
          <>
            <Button variant="text" autoFocus onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button
              variant="text"
              onClick={deleteDraft}
              className="text-error! before:bg-error!"
            >
              Delete
            </Button>
          </>
        }
      >
        &ldquo;{event.title}&rdquo; will be removed for good. It has never been
        published, so nobody else has seen it.
      </Dialog>
    </article>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-4 sm:p-5">
      <h2 className="text-title-md">{title}</h2>
      {children}
    </section>
  );
}

function AddLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-label-lg text-primary underline underline-offset-3"
    >
      {children}
    </Link>
  );
}

function StatusCard({ event, live }: { event: EventDetail; live: boolean }) {
  const timeZone = event.venue.timezone;
  const [Icon, title, text] = live
    ? [
        LiveIcon,
        "Live",
        `On the public site since ${formatEventDate(event.firstPublishedAt ?? event.startsAt, timeZone)}.`,
      ]
    : event.status === "published"
      ? [LiveIcon, "Ended", "Its page stays up, marked as ended."]
      : event.firstPublishedAt
        ? [
            LockIcon,
            "Draft",
            "It was public before, so it can never be deleted.",
          ]
        : [LockIcon, "Draft", "Only you can see it."];
  return (
    <section
      className={`flex gap-3 rounded-lg p-4 sm:p-5 ${live ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-low"}`}
    >
      <Icon className="size-6 shrink-0" />
      <div>
        <h2 className="text-title-md">{title}</h2>
        <p className={`text-body-md ${live ? "" : "text-on-surface-variant"}`}>
          {text}
        </p>
        {event.publicUrl && (
          <a
            href={event.publicUrl}
            target="_blank"
            rel="noopener"
            className="-ml-3 mt-1 inline-flex h-10 items-center gap-2 rounded-full px-3 text-label-lg underline-offset-4 hover:bg-current/8 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            View on public site
            <OpenInNewIcon className="size-4.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </section>
  );
}

function Tickets({ event }: { event: EventDetail }) {
  if (!event.tiers.length)
    return (
      <p className="text-body-lg text-on-surface-variant">
        No ticket tiers yet. At least one is needed before publishing.
      </p>
    );
  const total = event.tiers.reduce((sum, tier) => sum + tier.capacity, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-sm border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant text-label-lg text-on-surface-variant">
            <th scope="col" className="py-2 pr-4 font-medium">
              Tier
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Price
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Capacity
            </th>
          </tr>
        </thead>
        <tbody className="text-body-lg">
          {event.tiers.map((tier) => (
            <tr key={tier.id} className="border-b border-outline-variant/50">
              <td className="py-3 pr-4">{tier.name}</td>
              <td className="py-3 pr-4 text-right tabular-nums">
                {formatPrice(tier.price, event.currency)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {tier.capacity.toLocaleString("en-GB")}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-title-sm">
            <th
              scope="row"
              colSpan={2}
              className="py-3 pr-4 text-left font-medium"
            >
              Total capacity
            </th>
            <td className="py-3 text-right tabular-nums">
              {total.toLocaleString("en-GB")}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
