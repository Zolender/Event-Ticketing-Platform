"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

/** Closes on a press outside `wrapper`. */
export function useDismiss(
  wrapper: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [wrapper, open, close]);
}

/**
 * Opens a popup upwards when there is not enough room below its anchor (the phone's bottom bar
 * counts) and more above, by setting `data-up` on it. Decided before paint, so the page never
 * scrolls or jumps; style the upward position with `data-[up=true]:` classes.
 */
export function usePlacement(
  anchor: RefObject<HTMLElement | null>,
  popup: RefObject<HTMLElement | null>,
  open: boolean,
) {
  useLayoutEffect(() => {
    const element = popup.current;
    if (!open || !anchor.current || !element) return;
    const box = anchor.current.getBoundingClientRect();
    const bottomBar = window.matchMedia("(min-width: 40rem)").matches ? 0 : 64;
    const below = window.innerHeight - bottomBar - box.bottom;
    const needed = element.offsetHeight + 16;
    element.setAttribute("data-up", String(below < needed && box.top > below));
  }, [anchor, popup, open]);
}

/** Brings an item into view inside its scrolling list, never scrolling the page. */
export function scrollIntoList(
  list: HTMLElement | null,
  item: HTMLElement | null,
  centre = false,
) {
  if (!list || !item) return;
  if (centre) {
    list.scrollTop =
      item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
    return;
  }
  if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop;
  else if (
    item.offsetTop + item.offsetHeight >
    list.scrollTop + list.clientHeight
  )
    list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
}
