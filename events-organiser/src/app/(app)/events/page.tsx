import type { Metadata } from "next";
import { requireOrganiser } from "@/server/auth";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const organiser = await requireOrganiser();

  return (
    <>
      <h1 className="text-headline-md">Your events</h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Events organised by {organiser.displayName} will appear here.
      </p>
    </>
  );
}
