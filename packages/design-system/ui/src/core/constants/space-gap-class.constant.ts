/**
 * Stackra file contract:
 * Purpose: `SPACE_GAP_CLASS`, the gap class of each spacing step, for the layout primitives on web and native
 *          (Uniwind reads the same classes).
 * Boundary: data only; full class names, so Tailwind and Uniwind find them when they scan the source.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { Space } from "#contracts/enums/space.enum";

/** The gap class of each step. */
export const SPACE_GAP_CLASS = Object.freeze({
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const satisfies Record<Space, string>);
