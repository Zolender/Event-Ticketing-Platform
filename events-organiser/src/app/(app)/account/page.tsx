import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  CONTRAST_COOKIE,
  parseContrast,
  parseTheme,
  THEME_COOKIE,
} from "@/features/account/appearance";
import { AccountView } from "@/features/account/components/account-view";
import { getAccountOverview } from "@/features/account/server/account";
import { requireOrganiser } from "@/server/auth";

export const metadata: Metadata = { title: "Account" };

// Rendered on the server with what it needs; a rename refreshes it (and the top bar) in place.
export default async function AccountPage() {
  const organiser = await requireOrganiser();
  const [account, store] = await Promise.all([
    getAccountOverview(organiser),
    cookies(),
  ]);
  return (
    <AccountView
      account={account}
      theme={parseTheme(store.get(THEME_COOKIE)?.value)}
      contrast={parseContrast(store.get(CONTRAST_COOKIE)?.value)}
    />
  );
}
