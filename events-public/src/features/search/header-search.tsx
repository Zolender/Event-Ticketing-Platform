"use client";

import Form from "next/form";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { BackIcon, SearchIcon } from "@/components/ui/icons";

export const SEARCH_PLACEHOLDER = "Search events, venues or cities";

/**
 * Search from any page: a field on wider screens, an icon on phones that opens a full-screen
 * search view. Enter goes to the list with the search in the URL. Plain GET forms, so they work
 * before the page's JavaScript has loaded. The list page has its own large search bar instead.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  if (pathname === "/events") return null;

  return (
    <>
      <Form
        action="/events"
        role="search"
        className="hidden h-12 w-full max-w-90 items-center gap-3 rounded-full bg-surface-container-high px-4 text-on-surface-variant focus-within:outline-2 focus-within:outline-primary md:flex"
      >
        <SearchIcon className="size-5" />
        <label htmlFor="header-search" className="sr-only">
          {SEARCH_PLACEHOLDER}
        </label>
        <input
          id="header-search"
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={100}
          placeholder={SEARCH_PLACEHOLDER}
          className="h-full min-w-0 flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </Form>

      <button
        type="button"
        aria-label="Search"
        onClick={() => dialog.current?.showModal()}
        className="grid size-12 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary md:hidden"
      >
        <SearchIcon />
      </button>

      {/* Material's full-screen search view. Escape and the back button close it; the browser
          puts focus back on the search icon. */}
      <dialog
        ref={dialog}
        aria-label="Search"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-surface text-on-surface md:hidden"
      >
        <Form
          action="/events"
          role="search"
          onSubmit={() => dialog.current?.close()}
          className="flex h-18 items-center gap-1 border-b border-outline-variant bg-surface-container-high px-1"
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={() => dialog.current?.close()}
            className="grid size-12 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/8"
          >
            <BackIcon />
          </button>
          <label htmlFor="search-view" className="sr-only">
            {SEARCH_PLACEHOLDER}
          </label>
          <input
            id="search-view"
            name="q"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoFocus
            maxLength={100}
            placeholder={SEARCH_PLACEHOLDER}
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-body-lg outline-none placeholder:text-on-surface-variant"
          />
        </Form>
      </dialog>
    </>
  );
}
