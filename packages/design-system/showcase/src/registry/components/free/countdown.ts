/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/countdown` (Countdown).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Countdown. */
export const FREE_COUNTDOWN: ComponentEntry = {
  slug: "countdown",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Countdown",
  parts: ["Countdown"],
  hero: {},
  examples: [
    { id: "offer", card: true },
    { id: "stopwatch" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/date-label", "free/number-ticker", "free/progress-bar"],
  tokens: ["font.tabular"],
  keywords: ["countdown", "timer", "stopwatch", "offer ends", "clock", "elapsed"],
  status: "new",
};
