"use client";

import { useSyncExternalStore } from "react";
import { ScheduleIcon } from "@/components/ui/icons";
import { formatTime } from "../format";
import { countdownLabel, visitorTime } from "../relative";

// Both read the visitor's clock or zone, so the server renders nothing and the browser fills
// them in once the page has loaded: no hydration mismatch, and nothing stale in the cached HTML.

const never = () => () => {};

function useVisitorZone() {
  return useSyncExternalStore(
    never,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
}

function everyMinute(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

/** The current minute: stable between ticks, so React does not re-render for nothing. */
function useNowMinute() {
  return useSyncExternalStore(
    everyMinute,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null,
  );
}

type Props = { startsAt: string; timeZone: string };

export function YourTime({ startsAt, timeZone }: Props) {
  const zone = useVisitorZone();
  const text = zone && visitorTime(startsAt, timeZone, zone);
  return text ? <span className="animate-fade"> · {text}</span> : null;
}

export function Countdown({ startsAt, timeZone }: Props) {
  const now = useNowMinute();
  const label = now !== null && countdownLabel(startsAt, timeZone, now);
  if (!label) return null;
  return (
    <span className="inline-flex h-8 animate-fade items-center gap-1.5 rounded-sm bg-secondary-container px-3 text-label-lg text-on-secondary-container">
      <ScheduleIcon className="size-[18px]" />
      {label}
    </span>
  );
}

/** A place's time right now with what follows it, "11:18 there now"; nothing until the page has loaded. */
export function LocalTimeNow({
  timeZone,
  after,
}: {
  timeZone: string;
  after: string;
}) {
  const now = useNowMinute();
  if (now === null) return null;
  return (
    <span className="animate-fade">
      {formatTime(new Date(now).toISOString(), timeZone)}
      {after}
    </span>
  );
}
