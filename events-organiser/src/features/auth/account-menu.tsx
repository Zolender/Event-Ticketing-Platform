"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { flushSync } from "react-dom";
import { PersonIcon, SignOutIcon } from "@/components/ui/icons";
import { useSignOut } from "./use-sign-out";

type AccountMenuProps = { displayName: string; email: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => /^[a-z]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/** The avatar in the top bar and the menu it opens: who is signed in, Account, and Sign out. */
export function AccountMenu({ displayName, email }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const { signOut, pending } = useSignOut();
  const menuId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const mark = initials(displayName) || "?";

  function toggle() {
    if (open) return setOpen(false);
    // Render the open menu now, then move focus into it, as keyboard and screen reader users expect.
    flushSync(() => setOpen(true));
    firstItemRef.current?.focus();
  }

  // Arrow keys move between the items, as in any menu.
  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]"),
    ];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (move) {
      event.preventDefault();
      items[(index + move + items.length) % items.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      items[event.key === "Home" ? 0 : items.length - 1]?.focus();
    }
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account: ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
        className="grid size-10 cursor-pointer place-items-center rounded-full bg-secondary-container text-label-lg text-on-secondary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {mark}
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label="Account"
        onKeyDown={onMenuKeyDown}
        className={`absolute top-full right-0 z-20 mt-2 w-70 origin-top-right rounded-lg bg-surface-container-high p-2 shadow-lg motion-reduce:transition-none ${
          open
            ? // Visible at once (focus needs it); only opacity and scale animate in.
              "visible scale-100 opacity-100 transition-[opacity,transform] duration-200 ease-emphasized-decelerate"
            : // Visibility transitions too, so the menu stays visible until it has faded out.
              "invisible scale-95 opacity-0 transition-[opacity,transform,visibility] duration-150 ease-standard"
        }`}
      >
        <div className="flex items-center gap-3 px-3 pt-3 pb-3.5">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary-container text-title-md text-on-secondary-container"
          >
            {mark}
          </span>
          <span className="grid min-w-0">
            <span className="truncate text-title-sm leading-5 text-on-surface">
              {displayName}
            </span>
            <span className="truncate text-body-md leading-5 text-on-surface-variant">
              {email}
            </span>
          </span>
        </div>
        <div role="separator" className="mx-1 my-1.5 h-px bg-outline-variant" />
        <Link
          ref={firstItemRef}
          href="/account"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className="flex h-12 w-full items-center gap-3.5 rounded-md px-3 text-left text-body-lg text-on-surface hover:bg-on-surface/8 focus-visible:bg-on-surface/8 focus-visible:outline-none"
        >
          <PersonIcon className="size-6 text-on-surface-variant" />
          Account
        </Link>
        <button
          type="button"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          disabled={pending}
          onClick={signOut}
          className="flex h-12 w-full cursor-pointer items-center gap-3.5 rounded-md px-3 text-left text-body-lg text-on-surface hover:bg-on-surface/8 focus-visible:bg-on-surface/8 focus-visible:outline-none"
        >
          <SignOutIcon className="size-6 text-on-surface-variant" />
          Sign out
        </button>
      </div>
    </div>
  );
}
