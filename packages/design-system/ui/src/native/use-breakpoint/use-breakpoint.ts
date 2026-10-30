/**
 * Stackra file contract:
 * Purpose: `useBreakpoint()`, the native side of the one breakpoint hook: the window's breakpoint and size class
 *          (phone, tablet, desktop) from its width in points, so a POS screen picks a drawer on a phone and an inline
 *          panel on a counter tablet with the same rule as the web.
 * Boundary: reads `useWindowDimensions`, so it follows rotation and split view; the state is one frozen object per
 *           breakpoint.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0317.
 */
import { useWindowDimensions } from "react-native";

import type { BreakpointState } from "#contracts/types/breakpoint-state.type";
import { breakpointStateOf } from "#core/functions/breakpoint-state-of.function";

/**
 * The window's breakpoint and size class.
 *
 * @example
 * const { sizeClass } = useBreakpoint();
 * return sizeClass === "phone" ? <Drawer>{filters}</Drawer> : <View>{filters}</View>;
 */
export function useBreakpoint(): BreakpointState {
  return breakpointStateOf(useWindowDimensions().width);
}
