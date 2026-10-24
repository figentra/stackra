/**
 * Stackra file contract:
 * Purpose: `useNarrowScreen()`, whether the window is narrower than 768 px, the width below which a route overlay
 *          drawn as a `drawer` becomes a bottom sheet (a side panel leaves no room for the page on a phone).
 * Boundary: reads `matchMedia` and follows it; false where there is none (server render, a test without a stub). The
 *           breakpoint is the theme's `md`, written out because a media query cannot read a Tailwind class.
 * Runtime: browser
 * Governing contract: ADR 0314 (decision 6); ADR 0060 (right-to-left).
 */
import { useSyncExternalStore } from "react";

/** The query that matches a window narrower than the theme's `md` breakpoint. */
const NARROW_QUERY = "(max-width: 767px)";

/** Starts following the query; a no-op where `matchMedia` does not exist. */
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the query matches right now. */
function getSnapshot(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(NARROW_QUERY).matches
    : false;
}

/** True while the window is narrower than 768 px. */
export function useNarrowScreen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
