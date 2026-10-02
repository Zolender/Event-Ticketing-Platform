"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * The top app bar stays at the top of the window and, as Material does, takes a tinted background
 * once the page scrolls under it. Only the tint needs the browser; the contents stay server-made.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="sticky top-0 z-30 border-b border-outline-variant bg-surface transition-colors duration-200 data-[scrolled=true]:bg-surface-container motion-reduce:transition-none"
    >
      {children}
    </header>
  );
}
