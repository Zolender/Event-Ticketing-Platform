"use client";

import type { FocusEvent } from "react";
import {
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  ErrorIcon,
  LiveIcon,
  VisibilityOffIcon,
} from "@/components/ui/icons";
import {
  dismissSnackbar,
  pauseSnackbar,
  resumeSnackbar,
  useSnackbar,
  type SnackKind,
} from "@/lib/snackbar";

const ICONS: Record<SnackKind, typeof CheckIcon> = {
  done: CheckIcon,
  live: LiveIcon,
  hidden: VisibilityOffIcon,
  deleted: DeleteIcon,
  error: ErrorIcon,
};

/**
 * The snackbar's place: bottom centre, above the bottom bar on phones. Polite to screen readers.
 * Cut like a ticket, in the app's navy (the error colours for an error), with the icon on the stub.
 * Its timer waits while the pointer is over it or a button in it has focus.
 */
export function SnackbarHost() {
  const snack = useSnackbar();

  function leave(event: FocusEvent<HTMLDivElement>) {
    const box = event.currentTarget;
    if (!box.contains(event.relatedTarget) && !box.matches(":hover"))
      resumeSnackbar();
  }

  const Icon = snack ? ICONS[snack.kind] : null;
  const error = snack?.kind === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-40 flex justify-center sm:bottom-6"
    >
      {snack && Icon && (
        <div
          key={snack.id}
          onPointerEnter={pauseSnackbar}
          onPointerLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement))
              resumeSnackbar();
          }}
          onFocus={pauseSnackbar}
          onBlur={leave}
          className="pointer-events-auto w-full max-w-md animate-rise drop-shadow-lg motion-reduce:animate-fade sm:w-auto sm:min-w-80"
        >
          <div
            className={`flex min-h-12 items-center gap-3 rounded-md pr-1.5 text-body-md ticket-side-notches ${
              error
                ? "bg-error-container text-on-error-container"
                : "bg-primary-container text-on-primary-container-strong"
            }`}
          >
            <span
              className={`grid w-12 shrink-0 place-items-center self-stretch border-r-2 border-dashed ${
                error
                  ? "border-on-error-container/30"
                  : "border-on-primary-container-strong/35 text-on-primary-container"
              }`}
            >
              <Icon className="size-5" />
            </span>
            <span className="flex-1 py-3.5">{snack.text}</span>
            {snack.action && (
              <button
                type="button"
                onClick={() => {
                  snack.action?.onAction();
                  dismissSnackbar();
                }}
                className="h-9 cursor-pointer rounded-full bg-current/14 px-3 text-label-lg hover:bg-current/22 focus-visible:outline-2 focus-visible:outline-current"
              >
                {snack.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={dismissSnackbar}
              aria-label="Dismiss"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-current/12 focus-visible:outline-2 focus-visible:outline-current"
            >
              <CloseIcon className="size-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
