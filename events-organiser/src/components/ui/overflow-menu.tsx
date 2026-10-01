"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import { flushSync } from "react-dom";
import { MoreIcon } from "./icons";
import { useDismiss, usePlacement } from "./popover";

export type OverflowItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  /** Shown under the label; for a disabled item, why it is unavailable. */
  description?: string;
  disabled?: boolean;
  danger?: boolean;
};

/** The ⋮ button and its menu, for actions that should not compete with the main one. */
export function OverflowMenu({
  label,
  items,
}: {
  label: string;
  items: OverflowItem[];
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  usePlacement(buttonRef, menuRef, open);

  const close = useCallback((focusButton: boolean) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);
  useDismiss(wrapperRef, open, () => close(false));

  const entries = () => [
    ...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ??
      []),
  ];

  function toggle() {
    if (open) return close(true);
    // Render the open menu now, then move focus into it.
    flushSync(() => setOpen(true));
    entries()[0]?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    const all = entries();
    const index = all.indexOf(document.activeElement as HTMLElement);
    const go = (next: number) => {
      event.preventDefault();
      all[(next + all.length) % all.length]?.focus();
    };
    if (event.key === "ArrowDown") go(index + 1);
    else if (event.key === "ArrowUp") go(index - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(all.length - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") close(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        className="grid size-10 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary aria-expanded:bg-on-surface/8"
      >
        <MoreIcon />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={`absolute right-0 z-30 w-72 animate-menu-in rounded-xs bg-surface-container py-2 shadow-lg motion-reduce:animate-none top-full mt-1 origin-top-right data-[up=true]:top-auto data-[up=true]:bottom-full data-[up=true]:mt-0 data-[up=true]:mb-1 data-[up=true]:origin-bottom-right`}
        >
          {items.map(
            ({
              label: itemLabel,
              icon: Icon,
              onSelect,
              description,
              disabled,
              danger,
            }) => (
              // Disabled items stay focusable, so their reason can be read.
              <div
                key={itemLabel}
                role="menuitem"
                tabIndex={-1}
                aria-disabled={disabled || undefined}
                onClick={() => {
                  if (disabled) return;
                  close(false);
                  onSelect();
                }}
                onKeyDown={(event) => {
                  if (
                    (event.key === "Enter" || event.key === " ") &&
                    !disabled
                  ) {
                    event.preventDefault();
                    close(false);
                    onSelect();
                  }
                }}
                className={`flex min-h-12 items-start gap-3 px-3 py-3 text-body-lg outline-none focus-visible:bg-on-surface/8 ${
                  disabled
                    ? "cursor-default text-on-surface/38"
                    : `cursor-pointer hover:bg-on-surface/8 ${danger ? "text-error" : "text-on-surface"}`
                }`}
              >
                <Icon className="size-6 shrink-0" />
                <span className="min-w-0">
                  <span className="block">{itemLabel}</span>
                  {description && (
                    <span className="block text-body-md text-on-surface-variant">
                      {description}
                    </span>
                  )}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
