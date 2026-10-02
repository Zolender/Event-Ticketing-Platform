import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { HeaderSearch } from "@/features/search/header-search";

/** The width every page's content lines up to, with the side gutters. */
export const PAGE = "mx-auto w-full max-w-310 px-4 sm:px-8";

export function SiteHeader() {
  return (
    <header className="border-b border-outline-variant bg-surface">
      <div className={`${PAGE} flex h-16 items-center gap-2 sm:gap-4`}>
        <Link
          href="/"
          className="mr-auto flex items-center gap-2.5 rounded-sm text-title-lg font-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <Logo className="size-7" />
          Tiketi
        </Link>
        <HeaderSearch />
        <Link href="/events" className={buttonClass("text", "px-3")}>
          Events
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant">
      <div
        className={`${PAGE} flex flex-wrap items-center gap-2.5 py-5 text-body-md text-on-surface-variant`}
      >
        <Logo className="size-6" />
        <span>Tiketi · Find events and get the details.</span>
      </div>
    </footer>
  );
}
