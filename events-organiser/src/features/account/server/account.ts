import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Organiser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";
import { supabaseEnv } from "@/server/supabase-config";
import { nameSchema, passwordSchema } from "../account-schema";

export type AccountOverview = {
  displayName: string;
  email: string;
  organiserSince: string;
  lastSignInAt: string | null;
  published: number;
  drafts: number;
  /** The title the name preview shows: the next published event, else the next event. */
  previewTitle: string | null;
};

type Refusal = {
  ok: false;
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export async function getAccountOverview(
  organiser: Organiser,
): Promise<AccountOverview> {
  const supabase = await createSupabaseServerClient();
  const [profile, events] = await Promise.all([
    supabase
      .from("organisers")
      .select("created_at")
      .eq("id", organiser.id)
      .single(),
    supabase
      .from("events")
      .select("title, status, starts_at")
      .eq("organiser_id", organiser.id)
      .order("starts_at", { ascending: true }),
  ]);
  if (profile.error) throw profile.error;
  if (events.error) throw events.error;

  // Counted like the events tabs: events to come, published or draft.
  const now = Date.now();
  const upcoming = events.data.filter(
    (event) => Date.parse(event.starts_at) > now,
  );
  const published = upcoming.filter((event) => event.status === "published");
  return {
    displayName: organiser.displayName,
    email: organiser.email,
    organiserSince: profile.data.created_at,
    lastSignInAt: organiser.lastSignInAt,
    published: published.length,
    drafts: upcoming.length - published.length,
    previewTitle: published[0]?.title ?? upcoming[0]?.title ?? null,
  };
}

export async function renameOrganiser(
  organiser: Organiser,
  body: unknown,
): Promise<{ ok: true; displayName: string } | Refusal> {
  const parsed = nameSchema.safeParse(body);
  if (!parsed.success)
    return {
      ok: false,
      status: 400,
      code: "invalid_input",
      message: "Enter a name.",
      fields: {
        displayName: parsed.error.issues[0]?.message ?? "Enter a name.",
      },
    };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("organisers")
    .update({ display_name: parsed.data.displayName })
    .eq("id", organiser.id);
  if (error) throw error;
  return { ok: true, displayName: parsed.data.displayName };
}

/**
 * Changes the password after checking the current one, so someone at a computer left signed in
 * cannot lock the owner out. The check signs in on a separate client that keeps no cookies, then
 * ends that extra session at once; the organiser's own session is untouched.
 */
export async function changePassword(
  organiser: Organiser,
  body: unknown,
): Promise<{ ok: true } | Refusal> {
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fields[String(issue.path[0])] ??= issue.message;
    return {
      ok: false,
      status: 400,
      code: "invalid_input",
      message: "Some fields need fixing.",
      fields,
    };
  }

  const { url, key } = supabaseEnv();
  const checker = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const check = await checker.auth.signInWithPassword({
    email: organiser.email,
    password: parsed.data.current,
  });
  if (check.error?.status === 429)
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      message: "Too many attempts. Try again in a minute.",
    };
  if (check.error)
    return {
      ok: false,
      status: 400,
      code: "wrong_password",
      message: "That is not your current password.",
      fields: { current: "That's not your current password." },
    };
  await checker.auth.signOut({ scope: "local" });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.next,
  });
  if (error?.code === "same_password")
    return {
      ok: false,
      status: 400,
      code: "same_password",
      message: "Choose a different password.",
      fields: { next: "Choose a password different from the current one." },
    };
  if (error?.code === "weak_password")
    return {
      ok: false,
      status: 400,
      code: "weak_password",
      message: "Choose a stronger password.",
      fields: { next: "Choose a stronger password." },
    };
  if (error) throw error;
  return { ok: true };
}
