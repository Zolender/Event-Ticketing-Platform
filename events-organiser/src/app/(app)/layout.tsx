import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { requireOrganiser } from "@/server/auth";
import { AppShell, type RailState } from "./app-shell";

// Layout B: a rail of app sections on tablets and up, a bottom bar on phones.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const organiser = await requireOrganiser();
  const saved = (await cookies()).get("rail")?.value;
  const rail: RailState =
    saved === "expanded" || saved === "collapsed" ? saved : "auto";

  return (
    <AppShell
      rail={rail}
      organiser={{ displayName: organiser.displayName, email: organiser.email }}
    >
      {children}
    </AppShell>
  );
}
