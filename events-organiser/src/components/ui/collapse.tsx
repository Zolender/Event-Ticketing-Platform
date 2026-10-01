"use client";

import { useState, type ReactNode } from "react";

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Shows and hides its content without a jump: the space opens first and the content fades in;
 * closing folds the space away before the content is removed. Instant with reduced motion.
 * Content is clipped only while moving, so menus and focus rings inside are never cut off.
 */
export function Collapse({
  open,
  children,
  appear = true,
  onExited,
}: {
  open: boolean;
  children: ReactNode;
  /** Animate on first render too (a section added by the organiser), or not (already there). */
  appear?: boolean;
  /** Called once the content has folded away (at once with reduced motion). */
  onExited?: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<"enter" | "idle" | "leave">(
    open && appear ? "enter" : "idle",
  );

  // Follow `open` during render, so the change shows in the same frame.
  if (open && (!mounted || phase === "leave")) {
    setMounted(true);
    setPhase("enter");
  } else if (!open && mounted && phase !== "leave") {
    if (reducedMotion()) {
      setMounted(false);
      queueMicrotask(() => onExited?.());
    } else setPhase("leave");
  }
  if (!mounted) return null;

  const moving = phase !== "idle";
  return (
    <div
      className={`grid ${phase === "enter" ? "animate-grow-open" : ""} ${phase === "leave" ? "animate-grow-close" : ""} motion-reduce:animate-none`}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (phase === "leave") {
          setMounted(false);
          onExited?.();
        }
        setPhase("idle");
      }}
    >
      <div
        className={`min-h-0 ${moving ? "overflow-hidden" : ""} ${phase === "enter" ? "animate-[fade_200ms_80ms_linear_both] motion-reduce:animate-none" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
