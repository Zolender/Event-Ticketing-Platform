"use client";

import { useEffect, useRef, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** The buttons, safest first; give the safe one `autoFocus`. */
  actions: ReactNode;
};

/**
 * Material 3 basic dialog on the native `<dialog>`: the browser traps focus, makes the page
 * behind inert, closes on Escape and gives focus back to whatever opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(100%-2rem,22.5rem)] rounded-xl bg-surface-container-high p-6 text-on-surface shadow-xl"
    >
      <h2 id="dialog-title" className="text-headline-sm">
        {title}
      </h2>
      <div className="mt-4 text-body-md text-on-surface-variant">
        {children}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>
    </dialog>
  );
}
