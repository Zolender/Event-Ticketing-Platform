import type { ComponentType, ReactNode } from "react";

type EmptyStateProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** "error" when the list could not load at all. */
  tone?: "neutral" | "error";
};

/** Takes the place of a list with nothing in it: what the place is for, and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  tone = "neutral",
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span
        className={`mb-1 grid size-12 place-items-center rounded-lg ${tone === "error" ? "bg-error text-on-error" : "bg-surface-container text-on-surface-variant"}`}
      >
        <Icon className="size-6" />
      </span>
      <p className="text-title-md text-on-surface">{title}</p>
      {children && (
        <p className="max-w-sm text-body-md text-on-surface-variant">
          {children}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
