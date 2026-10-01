import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { SignInForm, type SignInReason } from "@/features/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

const reasons: SignInReason[] = ["signed-out", "session-ended"];

// Phones: the form sits on the page, top-aligned so the keyboard opening does not move it.
// From sm: a centred card tall enough for a message and every field error, so none resize it.
export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { reason } = await searchParams;
  const known = reasons.find((value) => value === reason);

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 px-4 pt-12 pb-8 sm:justify-center sm:pt-8">
      <p className="flex items-center gap-2 self-start text-title-sm text-on-surface-variant sm:self-center">
        <Logo />
        <span>
          <span className="text-on-surface">Tiketi</span> for organisers
        </span>
      </p>
      <section
        aria-labelledby="sign-in-title"
        className="flex w-full max-w-sm flex-col gap-6 [--field-bg:var(--color-surface)] sm:min-h-112 sm:rounded-xl sm:bg-surface-container-low sm:p-6 sm:[--field-bg:var(--color-surface-container-low)]"
      >
        <header className="flex flex-col gap-2">
          <h1 id="sign-in-title" className="text-headline-sm">
            Sign in
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Manage the events you organise.
          </p>
        </header>
        <SignInForm reason={known} />
      </section>
    </main>
  );
}
