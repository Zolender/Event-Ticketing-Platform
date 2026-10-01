"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { Banner, type BannerKind } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/ui/collapse";
import { DateField } from "@/components/ui/date-field";
import { Dialog } from "@/components/ui/dialog";
import { AddIcon, BackIcon, PlaceIcon } from "@/components/ui/icons";
import { MenuField } from "@/components/ui/menu-field";
import { Spinner } from "@/components/ui/spinner";
import { TextAreaField } from "@/components/ui/text-area-field";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/lib/fetch-json";
import { showSnackbar } from "@/lib/snackbar";
import {
  VenueFields,
  type VenueField,
} from "../../venues/components/venue-fields";
import { myVenuesQuery } from "../../venues/queries";
import { zoneCity } from "../../venues/zones";
import {
  checkWhen,
  DESCRIPTION_MAX,
  TITLE_MAX,
  validateEvent,
} from "../event-schema";
import {
  draftFromEvent,
  emptyDraft,
  inputFromDraft,
  type EventDraft,
  type TierDraft,
} from "../form-state";
import { currencies, currencyName, type Currency } from "../money";
import { useSaveEvent } from "../mutations";
import { myEventQuery } from "../queries";
import { timeOptions, todayIn, utcOffsetLabel } from "../time";
import { TiersEditor } from "./tiers-editor";

type Notice = { kind: BannerKind; title: string; text: string };

const notices: Record<string, Notice> = {
  offline: {
    kind: "error",
    title: "Can't reach Tiketi",
    text: "Check your connection. Your changes are still here.",
  },
  not_found: {
    kind: "error",
    title: "This event no longer exists",
    text: "It may have been deleted in another tab.",
  },
  needs_description: {
    kind: "error",
    title: "Can't save these changes",
    text: "A published event needs a description. Unpublish it first to remove it.",
  },
  needs_tier: {
    kind: "error",
    title: "Can't save these changes",
    text: "A published event needs at least one ticket tier.",
  },
  unexpected: {
    kind: "error",
    title: "Something went wrong",
    text: "Try saving again.",
  },
};

/** The form's message keys: tier fields follow the tier's own key, not its position. */
const tierKey = (tier: TierDraft, field: string) => `tier:${tier.key}:${field}`;

/** The one form for a new event (no `id`) and an existing one. */
export function EventForm({ id }: { id?: string }) {
  const router = useRouter();
  const { data: venues = [] } = useQuery(myVenuesQuery());
  const { data: event } = useQuery({
    ...myEventQuery(id ?? ""),
    enabled: Boolean(id),
  });
  const published = event?.status === "published";

  // The form starts from what the server sent; it does not follow later refetches while typing.
  const [initial] = useState(() =>
    event ? draftFromEvent(event) : emptyDraft(venues),
  );
  const [draft, setDraft] = useState<EventDraft>(initial);
  // Messages show for fields left with something in them, and for all after a Save attempt.
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // The clock is read after mount only, so the server and the browser render the same page.
  const [now, setNow] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const saved = useRef(false);
  const save = useSaveEvent(id);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  const input = useMemo(() => inputFromDraft(draft), [draft]);
  const dirty = useMemo(
    () => JSON.stringify(input) !== JSON.stringify(inputFromDraft(initial)),
    [input, initial],
  );

  // Leaving with unsaved changes asks first (closing the tab, reloading, the browser's own back).
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!saved.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const venue = venues.find((v) => v.id === draft.venueId);
  const zone = draft.creatingVenue ? draft.newVenue.timezone : venue?.timezone;

  // Every rule, worked out from what is typed now: a fixed field loses its message at once.
  const fieldErrors = useMemo(() => {
    const result = validateEvent(input);
    const all: Record<string, string> = result.ok ? {} : { ...result.errors };
    // Tier messages move from their position to the tier's key.
    for (const [key, message] of Object.entries(all)) {
      const match = /^tiers\.(\d+)\.(\w+)$/.exec(key);
      if (!match) continue;
      delete all[key];
      const tier = draft.tiers[Number(match[1])];
      if (tier) all[tierKey(tier, match[2])] = message;
    }
    if (!draft.creatingVenue && !venue) all.venue = "Choose a venue.";
    return all;
  }, [input, draft.tiers, draft.creatingVenue, venue]);

  const when = useMemo(() => {
    if (!zone || fieldErrors.date || fieldErrors.time || now === null)
      return null;
    return checkWhen(
      draft.date,
      draft.time,
      zone,
      now,
      published,
      event?.startsAt,
    );
  }, [
    zone,
    fieldErrors.date,
    fieldErrors.time,
    draft.date,
    draft.time,
    now,
    published,
    event?.startsAt,
  ]);
  // The date checks need the venue's zone and the clock, so they join the other messages here.
  const errors: Record<string, string> =
    when && !when.ok
      ? { [when.field]: when.error, ...fieldErrors }
      : fieldErrors;

  const show = (key: string) =>
    serverErrors[key] ??
    (submitted || visited.has(key) ? errors[key] : undefined);
  const leave = (key: string, value = "x") => {
    if (value.trim()) setVisited((current) => new Set(current).add(key));
  };
  const change = (patch: Partial<EventDraft>, ...keys: string[]) => {
    setDraft((current) => ({ ...current, ...patch }));
    if (keys.some((key) => serverErrors[key]))
      setServerErrors((current) => {
        const next = { ...current };
        keys.forEach((key) => delete next[key]);
        return next;
      });
  };

  function focusFirstProblem() {
    formRef.current
      ?.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-invalid="true"]',
      )
      ?.focus();
  }

  function onSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (save.isPending) return;
    // Render every message now, then move to the first one.
    flushSync(() => setSubmitted(true));
    if (Object.keys(errors).length) return focusFirstProblem();

    setNotice(null);
    save.mutate(input, {
      onSuccess: (data) => {
        saved.current = true;
        showSnackbar("Saved.");
        router.replace(`/events/${id ?? (data as { id: string }).id}`);
      },
      onError: (error) => {
        if (!(error instanceof ApiError)) return setNotice(notices.unexpected);
        if (Object.keys(error.fields).length) {
          const mapped: Record<string, string> = {};
          for (const [key, message] of Object.entries(error.fields)) {
            const match = /^tiers\.(\d+)\.(\w+)$/.exec(key);
            const tier = match && draft.tiers[Number(match[1])];
            mapped[tier ? tierKey(tier, match[2]) : key] = message;
          }
          flushSync(() => setServerErrors(mapped));
          return focusFirstProblem();
        }
        setNotice(notices[error.code] ?? notices.unexpected);
      },
    });
  }

  const back = id ? `/events/${id}` : "/events";
  function leaveForm() {
    if (dirty) setConfirmLeave(true);
    else router.push(back);
  }

  const venueErrors = Object.fromEntries(
    (["name", "address", "city", "country", "timezone"] as VenueField[]).map(
      (field) => [field, show(`venue.${field}`)],
    ),
  );

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={leaveForm}
          aria-label={
            id
              ? `Back to ${event?.title ?? "the event"}`
              : "Back to your events"
          }
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-secondary-container text-on-secondary-container transition-colors hover:bg-secondary-container/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <BackIcon />
        </button>
        <div className="min-w-0">
          <p className="truncate text-body-md text-on-surface-variant">
            {id ? event?.title : "Your events"}
          </p>
          <h1 className="text-headline-md">
            {id ? "Edit event" : "New event"}
          </h1>
        </div>
      </header>

      {published && (
        <Banner kind="info" title="This event is live">
          Saved changes show on the public site at once.
        </Banner>
      )}
      <Collapse open={Boolean(notice)}>
        {notice && (
          <Banner kind={notice.kind} title={notice.title}>
            {notice.text}
          </Banner>
        )}
      </Collapse>

      <Section id="details" title="Details">
        <TextField
          id="ev-title"
          label="Title"
          value={draft.title}
          error={show("title")}
          counter={
            draft.title.length > TITLE_MAX - 40
              ? { length: draft.title.trim().length, max: TITLE_MAX }
              : undefined
          }
          onChange={(e) => change({ title: e.target.value }, "title")}
          onBlur={(e) => leave("title", e.target.value)}
        />
        <TextAreaField
          id="ev-description"
          label="Description"
          value={draft.description}
          rows={6}
          error={show("description")}
          supporting="Needed before publishing, not before saving a draft."
          counter={{
            length: draft.description.trim().length,
            max: DESCRIPTION_MAX,
          }}
          onChange={(e) =>
            change({ description: e.target.value }, "description")
          }
          onBlur={(e) => leave("description", e.target.value)}
        />
      </Section>

      <Section id="when" title="When and where">
        {venues.length > 0 && (
          <MenuField
            id="ev-venue"
            label="Venue"
            value={draft.creatingVenue ? null : draft.venueId || null}
            options={venues.map((v) => ({
              value: v.id,
              label: v.name,
              sub: v.city,
            }))}
            onChange={(value) =>
              change({ venueId: value, creatingVenue: false }, "venue")
            }
            onClose={() => leave("venue")}
            action={{
              label: "New venue",
              icon: <AddIcon className="size-5" />,
              selected: draft.creatingVenue,
              onSelect: () => {
                change({ creatingVenue: true });
                setTimeout(() => document.getElementById("nv-name")?.focus());
              },
            }}
            error={draft.creatingVenue ? undefined : show("venue")}
          />
        )}
        <Collapse open={draft.creatingVenue} appear={venues.length > 0}>
          <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface p-4 [--field-bg:var(--color-surface)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-title-sm">
                <PlaceIcon className="size-5 text-primary" />
                New venue
              </h3>
              {venues.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    change({ creatingVenue: false });
                    document.getElementById("ev-venue")?.focus();
                  }}
                  className="h-10 cursor-pointer rounded-full px-3 text-label-lg text-primary hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Choose an existing venue instead
                </button>
              )}
            </div>
            {venues.length === 0 && (
              <p className="-mt-2 text-body-md text-on-surface-variant">
                You have no venues yet. Add the first one here; it is saved with
                the event.
              </p>
            )}
            <VenueFields
              idPrefix="nv"
              value={draft.newVenue}
              onChange={(newVenue) =>
                change(
                  { newVenue },
                  ...["name", "address", "city", "country", "timezone"].map(
                    (f) => `venue.${f}`,
                  ),
                )
              }
              errors={venueErrors}
              onLeave={(field) =>
                leave(
                  `venue.${field}`,
                  field === "timezone" ? "x" : draft.newVenue[field],
                )
              }
              now={now}
              suggest
            />
          </div>
        </Collapse>

        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            id="ev-date"
            label="Date"
            value={draft.date}
            today={zone && now !== null ? todayIn(zone, now) : null}
            onChange={(date) => change({ date }, "date")}
            onClose={() => leave("date")}
            error={show("date")}
            warning={when?.ok ? when.warning : undefined}
          />
          <MenuField
            id="ev-time"
            label="Starts at"
            value={draft.time || null}
            options={timeOptions(draft.time || null).map((time) => ({
              value: time,
              label: time,
            }))}
            onChange={(time) => change({ time }, "time")}
            onClose={() => leave("time")}
            error={show("time")}
          />
        </div>
        {zone && draft.time && when?.ok && now !== null && (
          <p className="-mt-2 text-body-md text-on-surface-variant">
            {draft.time}, {zoneCity(zone)} time (
            {utcOffsetLabel(zone, Date.parse(when.iso))}). Changing the venue
            keeps this time, at the new place.
          </p>
        )}
      </Section>

      <Section id="tickets" title="Tickets">
        <MenuField
          id="ev-currency"
          label="Currency"
          value={draft.currency}
          options={currencies.map((code) => ({
            value: code,
            label: code,
            sub: currencyName(code),
          }))}
          onChange={(currency) =>
            change({ currency: currency as Currency }, "currency")
          }
          className="sm:max-w-60"
        />
        <TiersEditor
          tiers={draft.tiers}
          currency={draft.currency}
          onChange={(update) =>
            setDraft((current) => ({
              ...current,
              tiers: update(current.tiers),
            }))
          }
          errorFor={(tier, field) => show(tierKey(tier, field))}
          onLeave={(tier, field) => leave(tierKey(tier, field), tier[field])}
        />
      </Section>

      <div className="sticky bottom-16 z-10 -mx-4 flex justify-end gap-2 border-t border-outline-variant bg-surface/95 px-4 py-3 backdrop-blur sm:bottom-0 sm:-mx-6 sm:px-6">
        <Button variant="text" onClick={leaveForm}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={save.isPending}
          aria-busy={save.isPending}
        >
          {save.isPending ? (
            <>
              <Spinner />
              Saving
            </>
          ) : id ? (
            "Save"
          ) : (
            "Save draft"
          )}
        </Button>
      </div>

      <Dialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Discard your changes?"
        actions={
          <>
            <Button
              variant="text"
              autoFocus
              onClick={() => setConfirmLeave(false)}
            >
              Keep editing
            </Button>
            <Button
              variant="text"
              onClick={() => {
                saved.current = true;
                setConfirmLeave(false);
                router.push(back);
              }}
            >
              Discard
            </Button>
          </>
        }
      >
        What you changed since the last save will be lost.
      </Dialog>
    </form>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-6 flex-col gap-5 rounded-lg bg-surface-container-low p-4 [--field-bg:var(--color-surface-container-low)] sm:p-5"
    >
      <h2 id={`${id}-title`} className="text-title-md">
        {title}
      </h2>
      {children}
    </section>
  );
}
