import type { ReactNode } from "react";

// Unlike a layout, a template mounts again on every navigation, so each page's content rises in.
// With reduced motion, it only fades.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col animate-rise motion-reduce:animate-fade">
      {children}
    </div>
  );
}
