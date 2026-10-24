/**
 * Stackra file contract:
 * Purpose: tells a web list that its end came into view: returns a ref for an empty marker placed after the last row
 *          and calls the handler each time the marker enters the viewport.
 * Boundary: internal, not exported from the `./react` entry. It observes one element with `IntersectionObserver` and
 *           does nothing without a handler or where the observer does not exist (jsdom, old browsers).
 * Runtime: browser
 * Governing contract: ADR 0313 (decision 4: the end reached is `onLoadMore`); ADR 0183 (no dependency for this).
 */
import { useEffect, useRef, type RefObject } from "react";

/**
 * Watches an end marker.
 * @param onReach - called when the marker enters the viewport; leave it out to stop watching
 * @param rowCount - how many rows the list holds: when it changes the marker is observed afresh, so a page shorter than
 *                   the viewport, which leaves the marker in view and so reports nothing new, still asks for the next
 * @returns the ref to put on the marker element
 */
export function useEndReached(
  onReach: (() => void) | undefined,
  rowCount: number,
): RefObject<HTMLDivElement | null> {
  const marker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = marker.current;
    if (!node || !onReach || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onReach();
    });
    observer.observe(node);
    return () => observer.disconnect();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `rowCount` is not read: it only restarts the observation
  }, [onReach, rowCount]);
  return marker;
}
