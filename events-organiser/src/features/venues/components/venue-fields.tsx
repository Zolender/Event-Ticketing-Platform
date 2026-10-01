"use client";

import { useMemo } from "react";
import { MenuField, type MenuOption } from "@/components/ui/menu-field";
import { TextField } from "@/components/ui/text-field";
import { utcOffsetLabel } from "@/features/events/time";
import {
  allZones,
  suggestZone,
  zoneCity,
  zoneMatches,
  zoneRegion,
} from "../zones";

export type VenueDraft = {
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  /** Picked by the organiser, so typing a country no longer suggests one. */
  zoneChosen: boolean;
};

export type VenueField = "name" | "address" | "city" | "country" | "timezone";

export const emptyVenue: VenueDraft = {
  name: "",
  address: "",
  city: "",
  country: "",
  timezone: "",
  zoneChosen: false,
};

type VenueFieldsProps = {
  idPrefix: string;
  value: VenueDraft;
  onChange: (next: VenueDraft) => void;
  /** Messages to show now, by field. */
  errors: Partial<Record<VenueField, string>>;
  warnings?: Partial<Record<VenueField, string>>;
  onLeave: (field: VenueField) => void;
  /** For the offsets shown next to each zone; null before mount. */
  now: number | null;
  /** New venues get a zone suggested from the country; an existing venue's zone never moves alone. */
  suggest: boolean;
};

/** Name, address, city, country and timezone, as the event form and the venues page ask them. */
export function VenueFields({
  idPrefix,
  value,
  onChange,
  errors,
  warnings = {},
  onLeave,
  now,
  suggest,
}: VenueFieldsProps) {
  // Offsets change with the seasons, so they are worked out for now, once per hour at most.
  const hour = now === null ? null : Math.floor(now / 3_600_000);
  const zoneOptions = useMemo<MenuOption[]>(
    () =>
      allZones().map((zone) => ({
        value: zone,
        label: zoneCity(zone),
        sub:
          hour === null
            ? zoneRegion(zone)
            : `${zoneRegion(zone)} · ${utcOffsetLabel(zone, hour * 3_600_000)}`,
      })),
    [hour],
  );

  const suggestion = suggestZone(value.country);
  const hint = !suggest
    ? undefined
    : suggestion.kind === "several" && !value.zoneChosen
      ? `${value.country.trim()} has several timezones. Choose the venue's.`
      : suggestion.kind === "one" &&
          !value.zoneChosen &&
          value.timezone === suggestion.zone
        ? "Suggested from the country."
        : undefined;

  function set(field: Exclude<VenueField, "timezone">, text: string) {
    const next = { ...value, [field]: text };
    if (field === "country" && suggest && !value.zoneChosen) {
      const suggested = suggestZone(text);
      if (suggested.kind === "one") next.timezone = suggested.zone;
    }
    onChange(next);
  }

  const text = (
    field: Exclude<VenueField, "timezone">,
    label: string,
    autoComplete: string,
  ) => (
    <TextField
      id={`${idPrefix}-${field}`}
      label={label}
      value={value[field]}
      autoComplete={autoComplete}
      error={errors[field]}
      warning={warnings[field]}
      onChange={(event) => set(field, event.target.value)}
      onBlur={() => onLeave(field)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {text("name", "Venue name", "off")}
      {text("address", "Address", "street-address")}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("city", "City", "address-level2")}
        {text("country", "Country", "country-name")}
      </div>
      <MenuField
        id={`${idPrefix}-timezone`}
        label="Timezone"
        value={value.timezone || null}
        options={zoneOptions}
        display={
          value.timezone ? (
            <>
              {zoneCity(value.timezone)}
              <span className="ml-2 text-body-md text-on-surface-variant">
                {value.timezone}
                {now !== null && ` · ${utcOffsetLabel(value.timezone, now)}`}
              </span>
            </>
          ) : undefined
        }
        onChange={(zone) =>
          onChange({ ...value, timezone: zone, zoneChosen: true })
        }
        onClose={() => onLeave("timezone")}
        search={{
          label: "Search timezones",
          matches: (option, query) => zoneMatches(option.value, query),
        }}
        error={errors.timezone}
        supporting={hint}
      />
    </div>
  );
}
