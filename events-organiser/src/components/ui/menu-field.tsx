"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  FieldMessage,
  messageIdFor,
  type FieldMessageProps,
} from "./field-message";
import { CheckIcon, DropdownIcon, SearchIcon } from "./icons";
import { scrollIntoList, useDismiss, usePlacement } from "./popover";

export type MenuOption = { value: string; label: string; sub?: string };

type MenuFieldProps = FieldMessageProps & {
  id: string;
  label: string;
  value: string | null;
  options: MenuOption[];
  onChange: (value: string) => void;
  /** What the closed field shows; by default the chosen option's label. */
  display?: ReactNode;
  /** One distinct action after a divider ("New venue"), shown as chosen while `selected`. */
  action?: {
    label: string;
    icon?: ReactNode;
    selected?: boolean;
    onSelect: () => void;
  };
  /** A filter box at the top of the menu, for long lists such as timezones. */
  search?: {
    label: string;
    matches: (option: MenuOption, query: string) => boolean;
  };
  /** Called when the menu closes, chosen or not: the field has been visited. */
  onClose?: () => void;
  className?: string;
};

type Item = { kind: "option"; option: MenuOption } | { kind: "action" };

/**
 * Material 3 exposed dropdown menu. The field looks like the outlined text field; the menu opens
 * below it, or above when there is no room, and scrolls inside itself, never the page.
 */
export function MenuField({
  id,
  label,
  value,
  options,
  onChange,
  display,
  action,
  search,
  onClose,
  className = "",
  error,
  warning,
  supporting,
}: MenuFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActiveState] = useState(0);
  // Keys can arrive faster than renders: the handlers read the active option from this ref.
  const activeRef = useRef(0);
  const setActive = (index: number) => {
    activeRef.current = index;
    setActiveState(index);
  };
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const listId = useId();
  usePlacement(buttonRef, popupRef, open);

  const visible = search
    ? options.filter((option) => search.matches(option, query))
    : options;
  const items: Item[] = [
    ...visible.map((option) => ({ kind: "option" as const, option })),
    ...(action ? [{ kind: "action" as const }] : []),
  ];
  const chosen = options.find((option) => option.value === value);
  const optionId = (index: number) => `${listId}-${index}`;

  const close = useCallback(
    (focusField: boolean) => {
      setOpen(false);
      setQuery("");
      if (focusField) buttonRef.current?.focus();
      onClose?.();
    },
    [onClose],
  );
  useDismiss(wrapperRef, open, () => close(false));

  function openMenu() {
    typed.current = { text: "", at: 0 };
    const selected = options.findIndex((option) => option.value === value);
    // Render the open menu now, then move focus into it.
    flushSync(() => {
      setOpen(true);
      setActive(action?.selected ? options.length : Math.max(selected, 0));
    });
    (searchRef.current ?? listRef.current)?.focus({ preventScroll: true });
  }

  // The chosen option starts in the middle of the menu; later moves keep the active one in view.
  const centred = useRef(false);
  useLayoutEffect(() => {
    if (!open) {
      centred.current = false;
      return;
    }
    scrollIntoList(
      listRef.current,
      document.getElementById(optionId(active)),
      !centred.current,
    );
    centred.current = true;
  });

  function choose(item: Item | undefined) {
    if (!item) return;
    if (item.kind === "action") action?.onSelect();
    else onChange(item.option.value);
    close(item.kind === "option");
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    const last = items.length - 1;
    const current = activeRef.current;
    const move = (index: number) => {
      event.preventDefault();
      setActive(Math.min(Math.max(index, 0), last));
    };
    switch (event.key) {
      case "ArrowDown":
        return move(current >= last ? 0 : current + 1);
      case "ArrowUp":
        return move(current <= 0 ? last : current - 1);
      case "Home":
        return search ? undefined : move(0);
      case "End":
        return search ? undefined : move(last);
      case "PageDown":
        return move(current + 8);
      case "PageUp":
        return move(current - 8);
      case "Enter":
        event.preventDefault();
        return choose(items[current]);
      case "Escape":
        event.preventDefault();
        return close(true);
      case "Tab":
        return close(false);
    }
    // Typing jumps to the next option starting with what was typed (without a search box).
    if (!search && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const now = Date.now();
      typed.current.text =
        (now - typed.current.at < 600 ? typed.current.text : "") +
        event.key.toLowerCase();
      typed.current.at = now;
      const find = (text: string) =>
        visible.findIndex((option) =>
          option.label.toLowerCase().startsWith(text),
        );
      // What was typed so far, or else just the last key ("19" then "2" finds 2 o'clock).
      let match = find(typed.current.text);
      if (match < 0) {
        typed.current.text = event.key.toLowerCase();
        match = find(typed.current.text);
      }
      if (match >= 0) setActive(match);
    }
  }

  const messageId = messageIdFor(id, { error, warning, supporting });
  const empty = !chosen && !action?.selected && !display;

  return (
    <div
      ref={wrapperRef}
      className={`relative flex flex-col gap-1 ${className}`}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-invalid={error ? true : undefined}
        aria-describedby={messageId}
        onClick={() => (open ? close(true) : openMenu())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openMenu();
          }
        }}
        className="group relative flex h-14 w-full cursor-pointer items-center gap-2 rounded-xs border border-outline bg-transparent pr-12 pl-4 text-left text-body-lg text-on-surface outline-none focus-visible:border-2 focus-visible:border-primary focus-visible:pl-3.75 aria-expanded:border-2 aria-expanded:border-primary aria-expanded:pl-3.75 data-invalid:border-error data-invalid:aria-expanded:border-error"
      >
        <span className="min-w-0 flex-1 truncate">
          {display ?? (action?.selected ? action.label : chosen?.label)}
          {!display && chosen?.sub && !action?.selected && (
            <span className="ml-2 text-body-md text-on-surface-variant">
              {chosen.sub}
            </span>
          )}
        </span>
        <span
          className={`pointer-events-none absolute left-3 bg-(--field-bg,var(--color-surface)) px-1 text-on-surface-variant transition-[top,font-size,line-height,color] duration-150 group-aria-expanded:text-primary group-data-invalid:text-error motion-reduce:transition-none ${
            empty && !open
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
          className={`absolute inset-x-0 z-30 animate-menu-in overflow-hidden rounded-xs bg-surface-container shadow-lg motion-reduce:animate-none top-14 mt-1 origin-top data-[up=true]:top-auto data-[up=true]:bottom-full data-[up=true]:mt-0 data-[up=true]:mb-1 data-[up=true]:origin-bottom`}
        >
          {search && (
            <div className="relative border-b border-outline-variant">
              <SearchIcon className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-surface-variant" />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-label={search.label}
                aria-controls={listId}
                aria-expanded="true"
                aria-activedescendant={
                  items.length ? optionId(active) : undefined
                }
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onMenuKeyDown}
                placeholder={search.label}
                autoComplete="off"
                className="h-12 w-full bg-transparent pr-4 pl-12 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            aria-activedescendant={
              !search && items.length ? optionId(active) : undefined
            }
            onKeyDown={search ? undefined : onMenuKeyDown}
            className="max-h-70 overflow-y-auto py-2 outline-none [scrollbar-width:thin]"
          >
            {visible.length === 0 && (
              <li className="px-4 py-3 text-body-md text-on-surface-variant">
                No matches
              </li>
            )}
            {items.map((item, index) => {
              const selected =
                item.kind === "action"
                  ? Boolean(action?.selected)
                  : item.option.value === value;
              return (
                <li
                  key={item.kind === "action" ? "__action" : item.option.value}
                  role="none"
                >
                  {item.kind === "action" && visible.length > 0 && (
                    <div
                      aria-hidden="true"
                      className="my-2 h-px bg-outline-variant"
                    />
                  )}
                  <div
                    id={optionId(index)}
                    role="option"
                    aria-selected={selected}
                    data-active={index === active}
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(item)}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-1.5 text-body-lg data-[active=true]:bg-on-surface/8 ${
                      selected
                        ? "bg-secondary-container text-on-secondary-container data-[active=true]:bg-secondary-container"
                        : item.kind === "action"
                          ? "text-label-lg text-primary"
                          : "text-on-surface"
                    }`}
                  >
                    {item.kind === "action" ? (
                      <>
                        {action?.icon}
                        <span className="flex-1">{action?.label}</span>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          {item.option.label}
                        </span>
                        {item.option.sub && (
                          <span
                            className={`block truncate text-body-md ${selected ? "opacity-85" : "text-on-surface-variant"}`}
                          >
                            {item.option.sub}
                          </span>
                        )}
                      </span>
                    )}
                    {selected && <CheckIcon className="size-5 shrink-0" />}
                  </div>
                </li>
              );
            })}
          </ul>
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
