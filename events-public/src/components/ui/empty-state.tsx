import type { ComponentType, ReactNode } from "react";

type EmptyStateProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  /** The page's main heading (404, errors) or a heading inside the page. */
  as?: "h1" | "h2";
  children?: ReactNode;
  action?: ReactNode;
};

/** Takes the place of something with nothing in it: what the place is for, and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  as: Heading = "h2",
  children,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex animate-rise flex-col items-center gap-2 px-4 py-12 text-center motion-reduce:animate-fade">
      <span className="mb-1 grid size-16 place-items-center rounded-[20px] bg-secondary-container text-on-secondary-container">
        <Icon className="size-8" />
      </span>
      <Heading className="text-title-lg text-on-surface">{title}</Heading>
      {children && (
        <p className="max-w-[42ch] text-body-lg text-on-surface-variant">
          {children}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
