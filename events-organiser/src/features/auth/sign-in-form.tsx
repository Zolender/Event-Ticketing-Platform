"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Banner, type BannerKind } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { signInSchema } from "./sign-in-schema";

type Field = "email" | "password";
type Notice = { kind: BannerKind; title: string; text: string };

// Supabase does not say how long a pause lasts; a minute matches its default window.
const PAUSE_SECONDS = 60;

const notices = {
  invalid_credentials: {
    kind: "error",
    title: "Wrong email or password",
    text: "Passwords are case-sensitive.",
  },
  offline: {
    kind: "error",
    title: "Can't reach Tiketi",
    text: "Check your internet connection.",
  },
  unexpected: {
    kind: "error",
    title: "Something went wrong",
    text: "Try signing in again.",
  },
  "signed-out": {
    kind: "info",
    title: "You're signed out",
    text: "Sign in again any time.",
  },
  "signed-out-everywhere": {
    kind: "info",
    title: "You're signed out everywhere",
    text: "Every session has ended. Sign in again here.",
  },
  "session-ended": {
    kind: "info",
    title: "Your session has ended",
    text: "Sign in to continue.",
  },
} satisfies Record<string, Notice>;

export type SignInReason =
  "signed-out" | "signed-out-everywhere" | "session-ended";

function fieldError(field: Field, value: string) {
  const result = signInSchema.shape[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

const asClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function SignInForm({ reason }: { reason?: SignInReason }) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState<Notice | null>(
    reason ? notices[reason] : null,
  );
  const [pausedFor, setPausedFor] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (pausedFor <= 0) return;
    const timer = setTimeout(
      () => setPausedFor((seconds) => seconds - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [pausedFor]);

  // Errors appear when a field is left, and go as soon as the value is fixed.
  function onBlur(field: Field, value: string) {
    if (value)
      setErrors((current) => ({
        ...current,
        [field]: fieldError(field, value),
      }));
  }
  function onChange(field: Field, value: string) {
    if (errors[field] && !fieldError(field, value)) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || pausedFor > 0) return;

    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    const next = {
      email: fieldError("email", email),
      password: fieldError("password", password),
    };
    if (next.email || next.password) {
      setErrors(next);
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setErrors({});
    setNotice(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        router.replace("/events");
        router.refresh();
        return;
      }
      const { code } = (await response.json().catch(() => ({}))) as {
        code?: string;
      };
      if (code === "rate_limited") {
        setPausedFor(PAUSE_SECONDS);
      } else {
        setNotice(
          code === "invalid_credentials"
            ? notices.invalid_credentials
            : notices.unexpected,
        );
        // Keep the email, clear the password, ready to retype.
        if (passwordRef.current) passwordRef.current.value = "";
        passwordRef.current?.focus();
      }
    } catch {
      setNotice(notices.offline);
    }
    setPending(false);
  }

  const paused = pausedFor > 0;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {paused ? (
        <Banner kind="warning" title="Too many attempts">
          Try again in{" "}
          <span className="tabular-nums">{asClock(pausedFor)}</span>.
        </Banner>
      ) : (
        notice && (
          <Banner kind={notice.kind} title={notice.title}>
            {notice.text}
          </Banner>
        )
      )}
      <TextField
        ref={emailRef}
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        autoFocus
        error={errors.email}
        onBlur={(event) => onBlur("email", event.target.value)}
        onChange={(event) => onChange("email", event.target.value)}
      />
      <PasswordField
        ref={passwordRef}
        id="password"
        name="password"
        label="Password"
        autoComplete="current-password"
        error={errors.password}
        onBlur={(event) => onBlur("password", event.target.value)}
        onChange={(event) => onChange("password", event.target.value)}
      />
      <Button
        type="submit"
        disabled={pending || paused}
        aria-busy={pending}
        className="mt-2 w-full"
      >
        {pending ? (
          <>
            <Spinner />
            Signing in
          </>
        ) : paused ? (
          <>
            Try again in{" "}
            <span className="tabular-nums">{asClock(pausedFor)}</span>
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
