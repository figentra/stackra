/**
 * Stackra file contract:
 * Purpose: `BREAKPOINT_STATES`, the one frozen `BreakpointState` of each breakpoint (and `base` below `sm`), so a hook
 *          hands out the same object until the screen crosses a breakpoint and its readers re-render only then.
 * Boundary: data only; `breakpointStateOf` picks one.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import type { BreakpointState } from "#contracts/types/breakpoint-state.type";

/** The state of each breakpoint: below `md` a phone, from `md` a tablet, from `lg` a desktop. */
export const BREAKPOINT_STATES: Readonly<Record<LayoutBreakpoint | "base", BreakpointState>> =
  Object.freeze({
    base: Object.freeze({ breakpoint: undefined, sizeClass: "phone" }),
    sm: Object.freeze({ breakpoint: "sm", sizeClass: "phone" }),
    md: Object.freeze({ breakpoint: "md", sizeClass: "tablet" }),
    lg: Object.freeze({ breakpoint: "lg", sizeClass: "desktop" }),
    xl: Object.freeze({ breakpoint: "xl", sizeClass: "desktop" }),
  });
