import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Logo className="size-12" />
      <div className="flex flex-col gap-2">
        <p className="text-label-lg text-on-surface-variant">404</p>
        <h1 className="text-headline-md">This page doesn&apos;t exist</h1>
        <p className="max-w-sm text-body-lg text-on-surface-variant">
          Check the address, or go back to your events.
        </p>
      </div>
      <Link
        href="/events"
        className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-label-lg text-on-primary"
      >
        Your events
      </Link>
    </main>
  );
}
