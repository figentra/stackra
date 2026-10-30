/**
 * Stackra file contract:
 * Purpose: `MarqueeContractProps`, the props every runtime's `Marquee` takes: the content that scrolls on a loop
 *          (logos, announcements), its name and its speed.
 * Boundary: types only. The content moves toward the reading start (leftward in English, rightward in Arabic), stops
 *           on hover, focus or the pause button, and stands still and wraps under reduced motion.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 2.2.2; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Marquee`. */
export interface MarqueeContractProps {
  /** The items, in reading order, for example brand logos or short announcements. */
  readonly children: ReactNode;
  /** What the strip is, for screen readers, for example "Brands we carry". */
  readonly label: string;
  /** Speed in pixels per second. Defaults to 40. */
  readonly speed?: number | undefined;
}
