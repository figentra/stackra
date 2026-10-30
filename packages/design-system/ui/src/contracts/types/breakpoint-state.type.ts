/**
 * Stackra file contract:
 * Purpose: `BreakpointState`, what `useBreakpoint` reports on web and native: the widest breakpoint the screen reaches
 *          and the size class it falls into.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import type { SizeClass } from "#contracts/enums/size-class.enum";

/** The screen's breakpoint and size class. */
export interface BreakpointState {
  /** The widest breakpoint the width reaches, or `undefined` below `sm` (Tailwind's base, a narrow phone). */
  readonly breakpoint: LayoutBreakpoint | undefined;
  /** `phone` below `md`, `tablet` from `md`, `desktop` from `lg`. */
  readonly sizeClass: SizeClass;
}
