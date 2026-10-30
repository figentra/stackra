/**
 * Stackra file contract:
 * Purpose: `cardColumns`, how many showcase cards sit in a row at a breakpoint: one on a phone (below `sm`, where the
 *          home's "All" page turns into swipeable shelves), two on a tablet or small laptop, three from `lg`. The
 *          same edges as the web playground's grids.
 * Boundary: a pure function over the design system's breakpoint state.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3; STA-1371 (listing by width, 2026-10-28).
 */
import type { BreakpointState } from "@stackra/ui/contracts";

/** The cards per row at `state`. */
export function cardColumns(state: BreakpointState): 1 | 2 | 3 {
  if (state.breakpoint === undefined) return 1;
  return state.sizeClass === "desktop" ? 3 : 2;
}
