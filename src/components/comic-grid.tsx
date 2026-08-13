import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard responsive grid for a flat list of ComicCards — 2 columns on
 * mobile up to 6 on xl. `className` can override the breakpoints for a
 * page that genuinely needs a different column count. */
export function ComicGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6", className)}>
      {children}
    </div>
  );
}
