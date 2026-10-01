"use client";

import { dismissSnackbar, useSnackbar } from "@/lib/snackbar";

/** The snackbar's place: bottom centre, above the bottom bar on phones. Polite to screen readers. */
export function SnackbarHost() {
  const snack = useSnackbar();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-40 flex justify-center sm:bottom-6"
    >
      {snack && (
        <div
          key={snack.id}
          className="pointer-events-auto flex min-h-12 w-full max-w-md animate-rise items-center gap-2 rounded-xs bg-inverse-surface py-1 pr-2 pl-4 text-body-md text-inverse-on-surface shadow-lg motion-reduce:animate-fade sm:w-auto sm:min-w-80"
        >
          <span className="flex-1 py-2">{snack.text}</span>
          {snack.action && (
            <button
              type="button"
              onClick={() => {
                snack.action?.onAction();
                dismissSnackbar();
              }}
              className="h-9 cursor-pointer rounded-full px-3 text-label-lg text-inverse-primary hover:bg-inverse-primary/8"
            >
              {snack.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
