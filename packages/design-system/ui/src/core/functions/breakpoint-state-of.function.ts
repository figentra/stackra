/**
 * Stackra file contract:
 * Purpose: `breakpointStateOf(width)`, the breakpoint and size class of a screen width, the one rule `useBreakpoint`
 *          follows on web and native.
 * Boundary: pure; returns one of the frozen `BREAKPOINT_STATES`, so the same breakpoint is the same object.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0317.
 */
import { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import type { BreakpointState } from "#contracts/types/breakpoint-state.type";
import { BREAKPOINT_STATES } from "#core/constants/breakpoint-states.constant";
import { BREAKPOINT_WIDTHS } from "#core/constants/breakpoint-widths.constant";

/**
 * The state of a width: the widest breakpoint it reaches and its size class.
 * @param width - the screen width in CSS pixels (web) or points (native)
 * @returns a frozen state, the same object for every width within one breakpoint
 */
export function breakpointStateOf(width: number): BreakpointState {
  // Narrowest first, so the last breakpoint the width reaches is the widest it reaches.
  const reached = LayoutBreakpoint.reduce<LayoutBreakpoint | undefined>(
    (widest, breakpoint) => (width >= BREAKPOINT_WIDTHS[breakpoint] ? breakpoint : widest),
    undefined,
  );
  return BREAKPOINT_STATES[reached ?? "base"];
}
