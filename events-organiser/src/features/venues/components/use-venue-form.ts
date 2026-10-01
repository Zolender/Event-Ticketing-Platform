"use client";

import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { fieldErrors } from "../../events/event-schema";
import { venueSchema, type VenueInput } from "../venue-schema";
import type { VenueDraft, VenueField } from "./venue-fields";

/**
 * A venue form's state with sign-in's rule for messages: a field shows its error once left with
 * something in it, every error shows after a save attempt, and a fixed field loses it at once.
 */
export function useVenueForm(initial: VenueDraft, formId: string) {
  const [draft, setDraft] = useState(initial);
  const [visited, setVisited] = useState<Set<VenueField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const input: VenueInput = useMemo(() => {
    const { name, address, city, country, timezone } = draft;
    return { name, address, city, country, timezone };
  }, [draft]);
  const errors = useMemo(() => {
    const result = venueSchema.safeParse(input);
    return result.success ? {} : fieldErrors(result.error);
  }, [input]);

  const shown = Object.fromEntries(
    (["name", "address", "city", "country", "timezone"] as VenueField[]).map(
      (field) => [
        field,
        serverErrors[field] ??
          (submitted || visited.has(field) ? errors[field] : undefined),
      ],
    ),
  ) as Partial<Record<VenueField, string>>;

  return {
    draft,
    input,
    errors: shown,
    change(next: VenueDraft) {
      setDraft(next);
      setServerErrors({});
    },
    leave(field: VenueField) {
      if (field === "timezone" || draft[field].trim())
        setVisited((current) => new Set(current).add(field));
    },
    /** Shows every message; true when the form can be sent, else focus goes to the first problem. */
    check() {
      flushSync(() => setSubmitted(true));
      if (!Object.keys(errors).length) return true;
      focusFirst(formId);
      return false;
    },
    showServerErrors(fields: Record<string, string>) {
      flushSync(() => setServerErrors(fields));
      focusFirst(formId);
    },
  };
}

function focusFirst(formId: string) {
  document
    .getElementById(formId)
    ?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
    ?.focus();
}
