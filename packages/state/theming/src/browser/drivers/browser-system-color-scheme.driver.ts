/**
 * Stackra file contract:
 * Purpose: `BrowserSystemColorSchemeDriver`, the `browser` driver of `SystemColorScheme`: the browser's
 *          `prefers-color-scheme` media query, and its `change` events.
 * Boundary: browser only (gen lists it for the web, PWA and desktop renderer targets). A runtime without `matchMedia`
 *           reads as `light` and never notifies. The query is opened per call, so a driver built before the document
 *           holds no stale handle.
 * Runtime: browser
 * Governing contract: ADR 0060 (light and dark); ADR 0127 2026-10-24 note (`./browser` entry); ADR 0294 (decision 17).
 */
import { Driver } from "@stackra/container";
import type { ResolvedColorScheme } from "@stackra/ui/contracts";

import { SystemColorScheme } from "#contracts/index";

/** The media query that matches a dark system preference. */
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The browser's colour preference. */
export class BrowserSystemColorSchemeDriver extends Driver(SystemColorScheme) {
  /** `dark` while the browser prefers dark, `light` otherwise. */
  current(): ResolvedColorScheme {
    return globalThis.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
  }

  /**
   * Calls `listener` on every change of the media query.
   *
   * @returns removes the listener.
   */
  subscribe(listener: () => void): () => void {
    const query = globalThis.matchMedia?.(DARK_QUERY);
    if (query === undefined) return () => undefined;
    const onChange = () => listener();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }
}
