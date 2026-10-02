"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { DarkModeIcon, DeviceIcon, LightModeIcon } from "@/components/ui/icons";
import { PasswordField } from "@/components/ui/password-field";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { NAME_MAX, nameSchema, passwordSchema } from "../account-schema";
import {
  CONTRAST_COOKIE,
  ONE_YEAR,
  THEME_COOKIE,
  type Contrast,
  type Theme,
} from "../appearance";
import type { AccountOverview } from "../server/account";

type AccountViewProps = {
  account: AccountOverview;
  theme: Theme;
  contrast: Contrast;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((word) => /^[a-z]/i.test(word))
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "?"
  );
}

/** A plain write to our API; the answer's `code` and `fields` pick the page's wording. */
async function send(method: "PATCH" | "POST", url: string, body: unknown) {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  } catch {
    return { status: 0, data: { code: "offline" } };
  }
}

export function AccountView({ account, theme, contrast }: AccountViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-full bg-secondary-container text-headline-sm text-on-secondary-container"
        >
          {initials(account.displayName)}
        </span>
        {/* Whose account it is; a rename refreshes the page, so this follows at once. */}
        <div className="min-w-0">
          <p className="text-label-lg text-on-surface-variant">Account</p>
          <h1 className="truncate text-headline-md">{account.displayName}</h1>
          <p className="truncate text-body-md text-on-surface-variant">
            {account.email}
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-3">
        <Stat value={String(account.published)} label="Published events" />
        <Stat value={String(account.drafts)} label="Drafts" />
        <Stat
          value={new Intl.DateTimeFormat("en-GB", {
            timeZone: "UTC",
            month: "short",
            year: "numeric",
          }).format(new Date(account.organiserSince))}
          label="Organiser since"
        />
      </dl>

      <NameSection account={account} />
      <SecuritySection account={account} />
      <AppearanceSection theme={theme} contrast={contrast} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse rounded-lg bg-surface-container-low px-4 py-3">
      <dt className="text-body-sm text-on-surface-variant sm:text-body-md">
        {label}
      </dt>
      <dd className="text-title-md whitespace-nowrap tabular-nums sm:text-headline-sm">
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface-container-low p-4 [--field-bg:var(--color-surface-container-low)] sm:p-5">
      <div>
        <h2 className="text-title-md">{title}</h2>
        {description && (
          <p className="mt-1 text-body-md text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** A short message after a save, read out politely and gone after a few seconds. */
function useDoneMessage() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  return [message, setMessage] as const;
}

function NameSection({ account }: { account: AccountOverview }) {
  const router = useRouter();
  const [saved, setSaved] = useState(account.displayName);
  const [name, setName] = useState(account.displayName);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useDoneMessage();
  const inputRef = useRef<HTMLInputElement>(null);

  const check = nameSchema.safeParse({ displayName: name });
  const error =
    serverError ??
    (submitted && !check.success ? check.error.issues[0]?.message : undefined);
  const changed = name.trim() !== saved;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    flushSync(() => setSubmitted(true));
    if (!check.success) return inputRef.current?.focus();
    setPending(true);
    setFailure(null);
    const { status, data } = await send("PATCH", "/api/account", {
      displayName: name,
    });
    setPending(false);
    if (status === 401) return router.replace("/sign-in?reason=session-ended");
    if (status === 200) {
      setSaved(data.displayName);
      setName(data.displayName);
      setSubmitted(false);
      setDone("Name saved. Your event pages show it now.");
      // The top bar and the account menu show the name too.
      router.refresh();
      return;
    }
    if (data.fields?.displayName) {
      setServerError(data.fields.displayName);
      return inputRef.current?.focus();
    }
    setFailure(
      data.code === "offline"
        ? "Can't reach Tiketi. Check your connection."
        : "Something went wrong. Try saving again.",
    );
  }

  return (
    <Section
      title="How you appear"
      description="Your organiser name is public: it shows on every event you publish."
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {failure && (
          <Banner kind="error" title="Couldn't save the name">
            {failure}
          </Banner>
        )}
        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <div className="flex flex-col gap-1">
            <TextField
              ref={inputRef}
              id="display-name"
              label="Organiser name"
              value={name}
              autoComplete="organization"
              error={error}
              onChange={(event) => {
                setName(event.target.value);
                setServerError(undefined);
              }}
            />
            {!error && (
              <p className="px-4 text-body-sm text-on-surface-variant tabular-nums">
                {name.trim().length} of {NAME_MAX} characters
              </p>
            )}
          </div>
          <div
            aria-label="Preview of your event pages"
            className="rounded-md border border-outline-variant bg-surface px-4 py-3"
          >
            <p className="text-label-sm tracking-wider text-on-surface-variant uppercase">
              On your event pages
            </p>
            <p className="mt-1 text-title-md">
              {account.previewTitle ?? "Your next event"}
            </p>
            <p className="text-body-md text-on-surface-variant">
              by{" "}
              <span className="text-label-lg text-primary">
                {name.trim() || "your name"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p role="status" className="text-body-md text-on-surface-variant">
            {done}
          </p>
          <Button
            type="submit"
            disabled={!changed || pending}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <Spinner />
                Saving
              </>
            ) : (
              "Save name"
            )}
          </Button>
        </div>
      </form>
    </Section>
  );
}

type PasswordKey = "current" | "next" | "confirm";

function SecuritySection({ account }: { account: AccountOverview }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [visited, setVisited] = useState<Set<PasswordKey>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<PasswordKey, string>>
  >({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [done, setDone] = useDoneMessage();
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Shown in the organiser's own zone, so it is worked out in the browser after mount.
  useEffect(() => {
    if (!account.lastSignInAt) return;
    const at = new Date(account.lastSignInAt);
    const day = (date: Date) => date.toDateString();
    const yesterday = new Date(Date.now() - 86_400_000);
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(at);
    const label =
      day(at) === day(new Date())
        ? `Today at ${time}`
        : day(at) === day(yesterday)
          ? `Yesterday at ${time}`
          : `${new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(at)} at ${time}`;
    // A value only the browser can know, set once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastSignIn(label);
  }, [account.lastSignInAt]);

  const errors: Partial<Record<PasswordKey, string>> = {};
  const parsed = passwordSchema.safeParse({
    current: values.current,
    next: values.next,
  });
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      errors[issue.path[0] as PasswordKey] ??= issue.message;
  if (!values.confirm) errors.confirm = "Enter the new password again.";
  else if (values.confirm !== values.next)
    errors.confirm = "The two new passwords don't match.";

  const show = (field: PasswordKey) =>
    serverErrors[field] ??
    (submitted || visited.has(field) ? errors[field] : undefined);
  const field = (name: PasswordKey) => ({
    id: `password-${name}`,
    value: values[name],
    error: show(name),
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      setServerErrors((current) => ({ ...current, [name]: undefined }));
    },
    onBlur: (event: { target: { value: string } }) => {
      if (event.target.value)
        setVisited((current) => new Set(current).add(name));
    },
  });

  function focusFirstProblem() {
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    flushSync(() => setSubmitted(true));
    if (Object.keys(errors).length) return focusFirstProblem();
    setPending(true);
    setFailure(null);
    const { status, data } = await send("POST", "/api/account/password", {
      current: values.current,
      next: values.next,
    });
    setPending(false);
    if (status === 401) return router.replace("/sign-in?reason=session-ended");
    if (status === 200) {
      setValues({ current: "", next: "", confirm: "" });
      setVisited(new Set());
      setSubmitted(false);
      setDone(
        "Password changed. Other devices stay signed in until you sign them out.",
      );
      return;
    }
    if (data.fields && Object.keys(data.fields).length) {
      flushSync(() => setServerErrors(data.fields));
      return focusFirstProblem();
    }
    setFailure(
      data.code === "rate_limited"
        ? "Too many attempts. Try again in a minute."
        : data.code === "offline"
          ? "Can't reach Tiketi. Check your connection."
          : "Something went wrong. Try again.",
    );
  }

  async function signOutEverywhere() {
    setEnding(true);
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ everywhere: true }),
    }).catch(() => null);
    queryClient.clear();
    router.replace("/sign-in?reason=signed-out-everywhere");
    router.refresh();
  }

  return (
    <Section title="Sign-in and security">
      <div className="flex flex-col gap-1">
        <div className="relative">
          <p
            id="email"
            className="flex h-14 items-center rounded-xs border border-dashed border-outline px-4 text-body-lg text-on-surface-variant"
          >
            {account.email}
          </p>
          <span className="absolute top-0 left-3 -translate-y-1/2 bg-(--field-bg) px-1 text-body-sm text-on-surface-variant">
            Email
          </span>
        </div>
        <p className="px-4 text-body-sm text-on-surface-variant">
          Used to sign in. It cannot be changed here: there is no mail service
          to confirm a new address.
        </p>
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        {failure && (
          <Banner kind="error" title="Couldn't change the password">
            {failure}
          </Banner>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            {...field("current")}
            label="Current password"
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <div className="flex flex-col gap-1">
            <PasswordField
              {...field("next")}
              label="New password"
              autoComplete="new-password"
            />
            {!show("next") && (
              <p className="px-4 text-body-sm text-on-surface-variant">
                At least 8 characters.
              </p>
            )}
          </div>
          <PasswordField
            {...field("confirm")}
            label="Confirm new password"
            autoComplete="new-password"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p role="status" className="text-body-md text-on-surface-variant">
            {done}
          </p>
          <Button
            type="submit"
            variant="outlined"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <Spinner />
                Changing
              </>
            ) : (
              "Change password"
            )}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-4 border-t border-outline-variant pt-4">
        <div>
          <p className="text-body-lg">Last signed in</p>
          <p className="text-body-md text-on-surface-variant">
            {lastSignIn ?? " "}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
          <div className="min-w-0 flex-1 basis-64">
            <p className="text-body-lg">Sign out of all devices</p>
            <p className="text-body-md text-on-surface-variant">
              Ends every session, including this one. Useful after signing in on
              a shared computer.
            </p>
          </div>
          <Button
            variant="outlined"
            onClick={signOutEverywhere}
            disabled={ending}
            aria-busy={ending}
            className="text-error! before:bg-error!"
          >
            {ending ? (
              <>
                <Spinner />
                Signing out
              </>
            ) : (
              "Sign out everywhere"
            )}
          </Button>
        </div>
      </div>
    </Section>
  );
}

function AppearanceSection({
  theme: initialTheme,
  contrast: initialContrast,
}: {
  theme: Theme;
  contrast: Contrast;
}) {
  const [theme, setTheme] = useState(initialTheme);
  const [contrast, setContrast] = useState(initialContrast);

  // Applied at once on the page, and kept in a cookie so the server renders it next time.
  function remember(name: string, value: string | null) {
    document.cookie =
      value === null
        ? `${name}=; path=/; max-age=0; samesite=lax`
        : `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }
  function chooseTheme(next: Theme) {
    setTheme(next);
    const root = document.documentElement;
    if (next === "system") delete root.dataset.theme;
    else root.dataset.theme = next;
    remember(THEME_COOKIE, next === "system" ? null : next);
  }
  function chooseContrast(next: Contrast) {
    setContrast(next);
    const root = document.documentElement;
    if (next === "high") root.dataset.contrast = "high";
    else delete root.dataset.contrast;
    remember(CONTRAST_COOKIE, next === "high" ? "high" : null);
  }

  return (
    <Section title="Appearance">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <p id="theme-label" className="text-body-lg">
            Theme
          </p>
          <p className="text-body-md text-on-surface-variant">
            Follows your device unless you choose.
          </p>
        </div>
        <Segmented
          labelledBy="theme-label"
          value={theme}
          onChange={chooseTheme}
          options={[
            { value: "system", label: "System", icon: DeviceIcon },
            { value: "light", label: "Light", icon: LightModeIcon },
            { value: "dark", label: "Dark", icon: DarkModeIcon },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
        <div className="min-w-0 flex-1 basis-56">
          <p id="contrast-label" className="text-body-lg">
            Contrast
          </p>
          <p className="text-body-md text-on-surface-variant">
            Higher contrast makes text and controls stand out more.
          </p>
        </div>
        <Segmented
          labelledBy="contrast-label"
          value={contrast}
          onChange={chooseContrast}
          options={[
            { value: "standard", label: "Standard" },
            { value: "high", label: "High" },
          ]}
        />
      </div>
    </Section>
  );
}

/** Material 3 segmented buttons, one choice: a radio group, arrow keys move between options. */
function Segmented<T extends string>({
  labelledBy,
  value,
  onChange,
  options,
}: {
  labelledBy: string;
  value: T;
  onChange: (value: T) => void;
  options: {
    value: T;
    label: string;
    icon?: ComponentType<{ className?: string }>;
  }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={(event) => {
        const move = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
        }[event.key];
        if (!move) return;
        event.preventDefault();
        const index = options.findIndex((option) => option.value === value);
        const next = options[(index + move + options.length) % options.length];
        onChange(next.value);
        event.currentTarget
          .querySelector<HTMLElement>(`[data-value="${next.value}"]`)
          ?.focus();
      }}
      className="inline-flex overflow-hidden rounded-full border border-outline"
    >
      {options.map(({ value: option, label, icon: Icon }) => {
        const checked = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            data-value={option}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option)}
            className={`flex h-10 cursor-pointer items-center gap-2 border-l border-outline px-4 text-label-lg first:border-l-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
              checked
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface hover:bg-on-surface/8"
            }`}
          >
            {Icon && <Icon className="size-4.5" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
