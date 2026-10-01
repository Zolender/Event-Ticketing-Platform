import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "./supabase";

export type Organiser = {
  id: string;
  email: string;
  displayName: string;
  /** When this account last signed in, from Supabase Auth. */
  lastSignInAt: string | null;
};

/**
 * The signed-in organiser, or null. `getUser()` asks Supabase Auth itself, so a session revoked
 * elsewhere is refused at once; cached so it happens once per request.
 */
export const getOrganiser = cache(async (): Promise<Organiser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organisers")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: data?.display_name ?? "Organiser",
    lastSignInAt: user.last_sign_in_at ?? null,
  };
});

/**
 * For pages: the organiser, or back to sign-in. The proxy already let this request through as
 * signed in, so a refusal here means the session was revoked or expired.
 */
export async function requireOrganiser(): Promise<Organiser> {
  const organiser = await getOrganiser();
  if (!organiser) redirect("/sign-in?reason=session-ended");
  return organiser;
}
