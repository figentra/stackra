/**
 * Stackra file contract:
 * Purpose: `BrowserSystemAccessibilityDriver`, the `browser` driver of `SystemAccessibility`: the browser's
 *          `prefers-reduced-motion: reduce` and `prefers-contrast: more` media queries, and their `change` events.
 * Boundary: browser only (gen lists it for the web, PWA and desktop renderer targets). The web has no bold-text
 *           setting and scales text through the browser's own zoom and root font size, so `boldText` is `false` and
 *           `fontScale` is `1`. A runtime without `matchMedia` reads the defaults and never notifies. The stylesheet
 *           already follows both queries (`@stackra/tokens` web CSS); this driver is for code that animates in JS.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, 2026-10-29 note); ADR 0127 2026-10-24 note (`./browser` entry).
 */
import { Driver } from "@stackra/container";

import { DEFAULT_ACCESSIBILITY_SETTINGS, SystemAccessibility } from "#contracts/index";
import type { AccessibilitySettings } from "#contracts/index";

/** The media query that matches a reduced-motion preference. */
const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** The media query that matches a more-contrast preference. */
const HIGH_CONTRAST_QUERY = "(prefers-contrast: more)";

/** The browser's accessibility preferences. */
export class BrowserSystemAccessibilityDriver extends Driver(SystemAccessibility) {
  private settings = DEFAULT_ACCESSIBILITY_SETTINGS;

  /** The preferences now: the same object until a query's answer changes. */
  current(): AccessibilitySettings {
    const reduceMotion = globalThis.matchMedia?.(REDUCE_MOTION_QUERY).matches ?? false;
    const highContrast = globalThis.matchMedia?.(HIGH_CONTRAST_QUERY).matches ?? false;
    if (reduceMotion !== this.settings.reduceMotion || highContrast !== this.settings.highContrast)
      this.settings = Object.freeze({ ...this.settings, reduceMotion, highContrast });
    return this.settings;
  }

  /**
   * Calls `listener` on every change of either media query.
   *
   * @returns removes the listener.
   */
  subscribe(listener: () => void): () => void {
    const queries = [REDUCE_MOTION_QUERY, HIGH_CONTRAST_QUERY].flatMap(
      (query) => globalThis.matchMedia?.(query) ?? [],
    );
    const onChange = () => listener();
    for (const query of queries) query.addEventListener("change", onChange);
    return () => {
      for (const query of queries) query.removeEventListener("change", onChange);
    };
  }
}
