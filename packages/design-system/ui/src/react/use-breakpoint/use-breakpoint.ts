/**
 * Stackra file contract:
 * Purpose: `useBreakpoint()`, the web side of the one breakpoint hook: the window's breakpoint and size class (phone,
 *          tablet, desktop), so a component picks a drawer on a phone and an inline panel on a desktop in code where a
 *          `md:` class cannot reach (which component to mount, not how it looks).
 * Boundary: listens to the window's `resize`; re-renders only when the width crosses a breakpoint, because each
 *           breakpoint is one frozen object. On the server it reports the phone base, as mobile-first CSS does.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0317.
 */
import { useSyncExternalStore } from "react";

import type { BreakpointState } from "#contracts/types/breakpoint-state.type";
import { BREAKPOINT_STATES } from "#core/constants/breakpoint-states.constant";
import { breakpointStateOf } from "#core/functions/breakpoint-state-of.function";

const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};

const current = () => breakpointStateOf(window.innerWidth);

const onServer = () => BREAKPOINT_STATES.base;

/**
 * The window's breakpoint and size class.
 *
 * @example
 * const { sizeClass } = useBreakpoint();
 * return sizeClass === "phone" ? <Drawer>{filters}</Drawer> : <aside>{filters}</aside>;
 */
export function useBreakpoint(): BreakpointState {
  return useSyncExternalStore(subscribe, current, onServer);
}
