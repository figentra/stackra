/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/time-clock` (TimeClock).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The TimeClock entry of the component registry. */
export const FREE_TIME_CLOCK: ComponentEntry = {
  slug: "time-clock",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TimeClock",
  parts: ["TimeClock"],
  // HeroUI has no clock face; this one is drawn in SVG on both platforms.
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "twenty-four-hour" },
    { id: "with-field", platforms: ["react"] },
  ],
  related: ["free/time-field", "free/time-picker", "free/wheel-picker"],
  tokens: ["color.accent", "color.default"],
  keywords: ["time", "clock", "hour", "minute", "analogue", "picker"],
  status: "new",
};
