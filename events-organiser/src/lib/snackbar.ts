"use client";

import { useSyncExternalStore } from "react";

// One short message at a time at the bottom of the screen ("Saved."). It lives outside React so
// a page can show it and then navigate: the app shell, which stays mounted, displays it.

export type Snack = {
  id: number;
  text: string;
  action?: { label: string; onAction: () => void };
};

let current: Snack | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function showSnackbar(text: string, action?: Snack["action"]) {
  current = { id: nextId++, text, action };
  clearTimeout(timer);
  timer = setTimeout(dismissSnackbar, action ? 6000 : 4000);
  emit();
}

export function dismissSnackbar() {
  current = null;
  clearTimeout(timer);
  emit();
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
