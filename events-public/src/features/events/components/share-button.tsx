"use client";

import { useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { ShareIcon } from "@/components/ui/icons";

/**
 * The phone's share sheet where there is one and a touch screen; elsewhere the link is copied and
 * a snackbar says so. Always the canonical address, whatever the visitor typed to get here.
 */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show(text: string) {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 4000);
  }

  async function share() {
    const url = new URL(path, window.location.origin).href;
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      // Closing the sheet without sharing rejects; there is nothing to say then.
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      show("Link copied.");
    } catch {
      show("Couldn't copy the link. Copy it from the address bar.");
    }
  }

  return (
    <>
      <button type="button" onClick={share} className={buttonClass("tonal")}>
        <ShareIcon className="size-[18px]" />
        Share
      </button>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-6 z-40 flex justify-center"
      >
        {message && (
          <div className="flex min-h-12 animate-rise items-center rounded-xs bg-inverse-surface px-4 text-body-md text-inverse-on-surface shadow-lg motion-reduce:animate-fade">
            {message}
          </div>
        )}
      </div>
    </>
  );
}
