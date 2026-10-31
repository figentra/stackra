/**
 * Stackra file contract:
 * Purpose: `useIsScrolled()`: whether the page has scrolled away from its top, so a header can turn to glass once
 *          content runs under it (the studio family's nav bar: solid at rest, glass when scrolled; ADR 0320 as
 *          amended 2026-10-31). Every header shares one passive scroll listener.
 * Boundary: reads the window's scroll position only; a header over an inner scroller passes `isScrolled` itself.
 *           False on the server and before the first scroll.
 * Runtime: browser
 * Governing contract: ADR 0320 (decision 1 as amended 2026-10-31).
 */
import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  addEventListener("scroll", onChange, { passive: true });
  return () => removeEventListener("scroll", onChange);
};

const isScrolled = () => scrollY > 0;

/** Whether the window has scrolled away from its top. */
export function useIsScrolled(): boolean {
  return useSyncExternalStore(subscribe, isScrolled, () => false);
}
