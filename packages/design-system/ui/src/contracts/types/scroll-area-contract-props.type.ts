/**
 * Stackra file contract:
 * Purpose: `ScrollAreaContractProps`, the props every runtime's `ScrollArea` takes: a bounded region that scrolls,
 *          fading its edges while there is more to see.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ReactNode } from "react";

import type { Orientation } from "#contracts/enums/orientation.enum";

/** Props shared by the web and native `ScrollArea`. */
export interface ScrollAreaContractProps {
  /** The content that scrolls. */
  readonly children: ReactNode;
  /** The region's name; a keyboard user tabs to it and scrolls with the arrow keys. */
  readonly label: string;
  /** The direction it scrolls; defaults to `vertical`. */
  readonly orientation?: Orientation | undefined;
  /** The most it grows, in pixels, before it scrolls (height when vertical, width when horizontal). */
  readonly maxSize?: number | undefined;
  /** The fade's depth in pixels; defaults to 40. */
  readonly fadeSize?: number | undefined;
}
