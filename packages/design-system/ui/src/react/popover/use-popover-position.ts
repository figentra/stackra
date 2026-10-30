/**
 * Stackra file contract:
 * Purpose: `usePopoverPosition`, the `updatePosition` of an open web Popover, for a change that moves the anchor or the
 *          page around it without resizing either (a list scrolled inside the trigger's row, a banner pushed in above
 *          it). Content that grows or shrinks needs no call: React Aria already watches the popover's and the trigger's
 *          size and re-anchors on its own.
 * Boundary: React Aria's `Popover` keeps its `updatePosition` to itself and re-measures on the window's `resize` event,
 *           so the function sends one, at most once a frame however often it is called; every open overlay
 *           re-measures, which is cheap. On native, HeroUI Native measures the content on each layout, so there is no
 *           equivalent to call.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (rules 10 and 12); owner approval 2026-10-29 (STA-1371,
 *          popover updatePosition).
 */
import { useCallback, useEffect, useRef } from "react";

/** The `updatePosition` of the open popovers, stable across renders. */
export function usePopoverPosition(): { readonly updatePosition: () => void } {
  const frame = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      // Cleared as well as cancelled: Strict Mode runs this and mounts again, and a stale id would block every call.
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
      frame.current = undefined;
    },
    [],
  );
  const updatePosition = useCallback(() => {
    if (frame.current !== undefined) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      window.dispatchEvent(new Event("resize"));
    });
  }, []);
  return { updatePosition };
}
