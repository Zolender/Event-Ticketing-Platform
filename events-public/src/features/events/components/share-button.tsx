"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { buttonClass } from "@/components/ui/button";
import {
  CloseIcon,
  ErrorIcon,
  LinkIcon,
  ShareIcon,
} from "@/components/ui/icons";

type Message = { text: string; error: boolean };

const SHOWN_FOR = 4000;

/**
 * The phone's share sheet where there is one and a touch screen; elsewhere the link is copied and
 * a snackbar says so. Always the canonical address, whatever the visitor typed to get here.
 * The snackbar is cut like a ticket, as in the organiser app; its timer waits while hovered or
 * focused.
 */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [message, setMessage] = useState<Message | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const remaining = useRef(0);
  const startedAt = useRef(0);

  function run() {
    clearTimeout(timer.current);
    startedAt.current = Date.now();
    timer.current = setTimeout(hide, remaining.current);
  }

  function hide() {
    clearTimeout(timer.current);
    setMessage(null);
  }

  function pause() {
    clearTimeout(timer.current);
    remaining.current -= Date.now() - startedAt.current;
  }

  function show(text: string, error = false) {
    setMessage({ text, error });
    remaining.current = SHOWN_FOR;
    run();
  }

  function leave(event: FocusEvent<HTMLDivElement>) {
    const box = event.currentTarget;
    if (!box.contains(event.relatedTarget) && !box.matches(":hover")) run();
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
      show("Couldn't copy the link. Copy it from the address bar.", true);
    }
  }

  const Icon = message?.error ? ErrorIcon : LinkIcon;

  return (
    <>
      <button type="button" onClick={share} className={buttonClass("tonal")}>
        <ShareIcon className="size-[18px]" />
        Share
      </button>
      {/* At the end of the body: the event card's ticket mask would otherwise pin it to the card. */}
      <SnackbarPlace>
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-6 z-40 flex justify-center"
        >
          {message && (
            <div
              onPointerEnter={pause}
              onPointerLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement))
                  run();
              }}
              onFocus={pause}
              onBlur={leave}
              className="pointer-events-auto w-full max-w-md animate-rise drop-shadow-lg motion-reduce:animate-fade sm:w-auto sm:min-w-80"
            >
              <div
                className={`flex min-h-12 items-center gap-3 rounded-md pr-1.5 text-body-md ticket-side-notches ${
                  message.error
                    ? "bg-error-container text-on-error-container"
                    : "bg-primary-container text-white"
                }`}
              >
                <span
                  className={`grid w-12 shrink-0 place-items-center self-stretch border-r-2 border-dashed ${
                    message.error
                      ? "border-on-error-container/30"
                      : "border-white/35 text-on-primary-container"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="flex-1 py-3.5">{message.text}</span>
                <button
                  type="button"
                  onClick={hide}
                  aria-label="Dismiss"
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-current/12 focus-visible:outline-2 focus-visible:outline-current"
                >
                  <CloseIcon className="size-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </SnackbarPlace>
    </>
  );
}

/** Renders its children at the end of the body once in the browser (the server has no body). */
function SnackbarPlace({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return mounted ? createPortal(children, document.body) : null;
}
