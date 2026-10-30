/**
 * Stackra file contract:
 * Purpose: `HoloCardContractProps`, the props of every runtime's `HoloCard`: a card that tilts toward the pointer or
 *          finger with a holographic sheen, for a membership card, a reward or a badge.
 * Boundary: types only. Decorative motion: still under reduced motion, and never the only way to read the content.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 2.3.3; STA-1371.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `HoloCard`. */
export interface HoloCardContractProps {
  readonly children: ReactNode;
  /** The most the card tilts, in degrees; 10 by default. */
  readonly maxTilt?: number | undefined;
  /** True to hold the card still with no sheen. */
  readonly isStill?: boolean | undefined;
}
