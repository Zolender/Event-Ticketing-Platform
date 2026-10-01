import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { requireOrganiser } from "@/server/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const organiser = await requireOrganiser();

  return (
    <div className="min-h-dvh">
      <header className="flex h-16 items-center gap-4 bg-surface-container px-4 sm:px-6">
        <Link href="/events" className="flex items-center gap-2">
          <Logo className="size-7" />
          <span className="text-title-lg">Tiketi</span>
          <span className="hidden text-body-sm text-on-surface-variant sm:inline">
            for organisers
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-1">
            <li>
              <Link
                href="/events"
                className="rounded-full px-4 py-2 text-label-lg text-on-surface-variant hover:bg-on-surface/8"
              >
                Events
              </Link>
            </li>
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-body-md text-on-surface-variant sm:inline">
            {organiser.displayName}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
