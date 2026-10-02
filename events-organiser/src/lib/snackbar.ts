"use client";

import { useSyncExternalStore } from "react";

// One short message at a time at the bottom of the screen ("Saved."). It lives outside React so
// a page can show it and then navigate: the app shell, which stays mounted, displays it.

/** What happened, which picks the icon; an error also takes the error colours. */
export type SnackKind = "done" | "live" | "hidden" | "deleted" | "error";

export type Snack = {
  id: number;
  text: string;
  kind: SnackKind;
  action?: { label: string; onAction: () => void };
};

let current: Snack | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
// Time left on screen; it stops running while the snackbar is hovered or holds focus, so nobody
// loses an Undo while reaching for it.
let remaining = 0;
let startedAt = 0;
let paused = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function run() {
  clearTimeout(timer);
  startedAt = Date.now();
  timer = setTimeout(dismissSnackbar, remaining);
}

export function showSnackbar(
  text: string,
  {
    kind = "done",
    action,
  }: { kind?: SnackKind; action?: Snack["action"] } = {},
) {
  current = { id: nextId++, text, kind, action };
  remaining = action ? 6000 : 4000;
  paused = false;
  run();
  emit();
}

export function dismissSnackbar() {
  current = null;
  clearTimeout(timer);
  emit();
}

export function pauseSnackbar() {
  if (!current || paused) return;
  paused = true;
  clearTimeout(timer);
  remaining -= Date.now() - startedAt;
}

export function resumeSnackbar() {
  if (!current || !paused) return;
  paused = false;
  run();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSnackbar() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
