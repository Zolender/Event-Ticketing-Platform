import type { ReactNode } from "react";
import { ErrorIcon, InfoIcon, OfflineIcon } from "./icons";

const kinds = {
  error: {
    icon: ErrorIcon,
    role: "alert",
    colours: "bg-error-container text-on-error-container",
  },
  info: {
    icon: InfoIcon,
    role: "status",
    colours: "bg-secondary-container text-on-secondary-container",
  },
  offline: {
    icon: OfflineIcon,
    role: "status",
    colours: "bg-secondary-container text-on-secondary-container",
  },
} as const;

type BannerProps = {
  kind: keyof typeof kinds;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

/** A message about the whole page or list: a title, one short line, and at most one action. */
export function Banner({ kind, title, children, action }: BannerProps) {
  const { icon: Icon, role, colours } = kinds[kind];
  return (
    <div
      role={role}
      className={`flex animate-rise flex-wrap items-center gap-x-3 gap-y-1 rounded-md py-2 pr-2 pl-4 motion-reduce:animate-fade ${colours}`}
    >
      <Icon className="size-5" />
      <p className="min-w-48 flex-1 py-1 text-body-md">
        <span className="text-title-sm">{title}</span>
        {children && <> {children}</>}
      </p>
      {action}
    </div>
  );
}
