import type { ReactNode } from "react";
import { ErrorIcon, InfoIcon, WarningIcon } from "./icons";

const kinds = {
  error: {
    icon: ErrorIcon,
    role: "alert",
    colours: "bg-error-container text-on-error-container",
  },
  warning: {
    icon: WarningIcon,
    role: "alert",
    colours: "bg-warning-container text-on-warning-container",
  },
  info: {
    icon: InfoIcon,
    role: "status",
    colours: "bg-secondary-container text-on-secondary-container",
  },
} as const;

export type BannerKind = keyof typeof kinds;

type BannerProps = { kind: BannerKind; title: string; children?: ReactNode };

/**
 * A message about the whole form: errors block, warnings inform, info explains why you are here.
 * Keep it to a title and one short line. Errors and warnings are announced at once (role "alert").
 */
export function Banner({ kind, title, children }: BannerProps) {
  const { icon: Icon, role, colours } = kinds[kind];
  return (
    <div
      role={role}
      className={`grid grid-cols-[24px_1fr] gap-x-3 rounded-md px-4 py-3 ${colours}`}
    >
      <Icon className="row-span-2 mt-0.5 size-6" />
      <p className="text-title-sm">{title}</p>
      {children && <p className="text-body-md">{children}</p>}
    </div>
  );
}
