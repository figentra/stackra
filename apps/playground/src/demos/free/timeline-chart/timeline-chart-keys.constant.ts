/**
 * Stackra file contract:
 * Purpose: `TIMELINE_CHART_KEYS`, the typed keys of the web Timeline chart demos' words in `assets/lang/<locale>/timeline_chart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The timeline_chart namespace's keys. */
export const TIMELINE_CHART_KEYS = keys({
  timeline_chart: [
    "label",
    "design",
    "build",
    "launch",
    "research",
    "screens",
    "api",
    "app",
    "beta",
    "release",
  ],
});
