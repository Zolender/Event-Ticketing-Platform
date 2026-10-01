"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  formatMonth,
  formatPlainDate,
  monthGrid,
  shiftDays,
  shiftMonths,
  weekdayOf,
  type PlainDate,
} from "@/features/events/time";
import {
  FieldMessage,
  messageIdFor,
  type FieldMessageProps,
} from "./field-message";
import { ChevronLeftIcon, ChevronRightIcon, DropdownIcon } from "./icons";
import { useDismiss, usePlacement } from "./popover";

type DateFieldProps = FieldMessageProps & {
  id: string;
  label: string;
  value: PlainDate;
  onChange: (date: PlainDate) => void;
  /** Today at the venue, known only after mount (it depends on the clock), else null. */
  today: PlainDate | null;
  onClose?: () => void;
};

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const splitDate = (date: PlainDate) =>
  date.split("-").map(Number) as [number, number, number];

/**
 * Material 3 docked date picker: the field opens a month calendar under it (or above when there
 * is no room). Days before today at the venue are dimmed, not blocked: a draft may record a date
 * that has passed, and the form says so.
 */
export function DateField({
  id,
  label,
  value,
  onChange,
  today,
  onClose,
  error,
  warning,
  supporting,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<PlainDate>(
    value || today || "2026-01-01",
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  usePlacement(buttonRef, popupRef, open);
  const [year, month] = splitDate(focused);

  const close = useCallback(
    (focusField: boolean) => {
      setOpen(false);
      if (focusField) buttonRef.current?.focus();
      onClose?.();
    },
    [onClose],
  );
  useDismiss(wrapperRef, open, () => close(false));

  // Keyboard focus follows the focused day, including after the month changes.
  const moved = useRef(false);
  useLayoutEffect(() => {
    if (!open || !moved.current) return;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)
      ?.focus({ preventScroll: true });
  }, [open, focused]);

  function openPicker() {
    setFocused(value || today || focused);
    moved.current = true;
    setOpen(true);
  }

  function choose(date: PlainDate) {
    onChange(date);
    close(true);
  }

  function onGridKeyDown(event: KeyboardEvent) {
    const weekday = weekdayOf(focused);
    const go = (date: PlainDate) => {
      event.preventDefault();
      moved.current = true;
      setFocused(date);
    };
    switch (event.key) {
      case "ArrowLeft":
        return go(shiftDays(focused, -1));
      case "ArrowRight":
        return go(shiftDays(focused, 1));
      case "ArrowUp":
        return go(shiftDays(focused, -7));
      case "ArrowDown":
        return go(shiftDays(focused, 7));
      case "Home":
        return go(shiftDays(focused, -weekday));
      case "End":
        return go(shiftDays(focused, 6 - weekday));
      case "PageUp":
        return go(shiftMonths(focused, event.shiftKey ? -12 : -1));
      case "PageDown":
        return go(shiftMonths(focused, event.shiftKey ? 12 : 1));
      case "Escape":
        event.preventDefault();
        return close(true);
    }
  }

  const messageId = messageIdFor(id, { error, warning, supporting });

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-invalid={error ? true : undefined}
        aria-describedby={messageId}
        onClick={() => (open ? close(true) : openPicker())}
        className="group relative flex h-14 w-full cursor-pointer items-center rounded-xs border border-outline bg-transparent pr-12 pl-4 text-left text-body-lg text-on-surface outline-none focus-visible:border-2 focus-visible:border-primary focus-visible:pl-3.75 aria-expanded:border-2 aria-expanded:border-primary aria-expanded:pl-3.75 data-invalid:border-error data-invalid:aria-expanded:border-error"
      >
        <span className="truncate">{value ? formatPlainDate(value) : ""}</span>
        <span
          className={`pointer-events-none absolute left-3 bg-(--field-bg,var(--color-surface)) px-1 text-on-surface-variant transition-[top,font-size,line-height,color] duration-150 group-aria-expanded:text-primary group-data-invalid:text-error motion-reduce:transition-none ${
            !value && !open
              ? "top-1/2 -translate-y-1/2 text-body-lg"
              : "top-0 -translate-y-1/2 text-body-sm"
          }`}
        >
          {label}
        </span>
        <DropdownIcon className="absolute top-1/2 right-3 size-6 -translate-y-1/2 text-on-surface-variant transition-transform duration-200 group-aria-expanded:rotate-180 motion-reduce:transition-none" />
      </button>

      {open && (
        <div
          ref={popupRef}
          role="dialog"
          aria-labelledby={titleId}
          className={`absolute left-0 z-30 w-82 max-w-[calc(100vw-2rem)] animate-menu-in rounded-lg bg-surface-container-high p-3 pb-2 shadow-lg motion-reduce:animate-none top-14 mt-1 origin-top data-[up=true]:top-auto data-[up=true]:bottom-full data-[up=true]:mt-0 data-[up=true]:mb-1 data-[up=true]:origin-bottom`}
        >
          <div className="flex items-center justify-between pb-2 pl-3">
            <p
              id={titleId}
              aria-live="polite"
              className="text-title-sm text-on-surface"
            >
              {formatMonth(year, month)}
            </p>
            <div className="flex">
              {(
                [
                  [-1, "Previous month", ChevronLeftIcon],
                  [1, "Next month", ChevronRightIcon],
                ] as const
              ).map(([delta, name, Icon]) => (
                <button
                  key={delta}
                  type="button"
                  aria-label={name}
                  onClick={() => {
                    moved.current = false;
                    setFocused(shiftMonths(focused, delta));
                  }}
                  className="grid size-10 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Icon />
                </button>
              ))}
            </div>
          </div>
          <div
            ref={gridRef}
            role="group"
            aria-labelledby={titleId}
            onKeyDown={onGridKeyDown}
            className="grid grid-cols-7 gap-0.5 text-center"
          >
            {WEEKDAYS.map((weekday) => (
              <abbr
                key={weekday}
                title={weekday}
                className="grid h-8 place-items-center text-body-sm text-on-surface-variant no-underline"
              >
                {weekday[0]}
              </abbr>
            ))}
            {monthGrid(year, month).map((date, index) =>
              date ? (
                <button
                  key={date}
                  type="button"
                  data-date={date}
                  tabIndex={date === focused ? 0 : -1}
                  aria-label={formatPlainDate(date)}
                  aria-pressed={date === value}
                  aria-current={date === today ? "date" : undefined}
                  onClick={() => choose(date)}
                  className={`mx-auto grid size-10 cursor-pointer place-items-center rounded-full text-body-md tabular-nums focus-visible:outline-2 focus-visible:outline-primary ${
                    date === value
                      ? "bg-primary text-on-primary"
                      : date === today
                        ? "text-primary ring-1 ring-primary ring-inset hover:bg-primary/8"
                        : today && date < today
                          ? "text-on-surface-variant opacity-60 hover:bg-on-surface/8"
                          : "text-on-surface hover:bg-on-surface/8"
                  }`}
                >
                  {Number(date.slice(8))}
                </button>
              ) : (
                <span key={`blank-${index}`} />
              ),
            )}
          </div>
          <div className="flex justify-end gap-1 pt-1.5">
            {today && (
              <button
                type="button"
                onClick={() => {
                  moved.current = true;
                  setFocused(today);
                }}
                className="h-10 cursor-pointer rounded-full px-3 text-label-lg text-primary hover:bg-primary/8"
              >
                Today
              </button>
            )}
            <button
              type="button"
              onClick={() => close(true)}
              className="h-10 cursor-pointer rounded-full px-3 text-label-lg text-primary hover:bg-primary/8"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <FieldMessage
        id={`${id}-message`}
        error={error}
        warning={warning}
        supporting={supporting}
      />
    </div>
  );
}
