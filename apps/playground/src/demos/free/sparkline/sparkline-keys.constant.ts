/**
 * Stackra file contract:
 * Purpose: `SPARKLINE_KEYS`, the typed keys of the web Sparkline demos' words in `assets/lang/<locale>/sparkline.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The sparkline namespace's keys. */
export const SPARKLINE_KEYS = keys({
  sparkline: [
    "desktop",
    "mobile",
    "visitors",
    "months_description",
    "trend",
    "chrome",
    "safari",
    "firefox",
    "edge",
    "other",
    "line",
    "area",
    "bar",
    "line_caption",
    "area_caption",
    "bar_caption",
    "stat_label",
    "stat_badge",
    "stat_trend",
  ],
});
