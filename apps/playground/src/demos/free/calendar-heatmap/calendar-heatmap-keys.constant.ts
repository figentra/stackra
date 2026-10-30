/**
 * Stackra file contract:
 * Purpose: `CALENDAR_HEATMAP_KEYS`, the typed keys of the web Calendar heatmap demos' words in `assets/lang/<locale>/calendar_heatmap.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The calendar_heatmap namespace's keys. */
export const CALENDAR_HEATMAP_KEYS = keys({
  calendar_heatmap: ["activity_title", "activity_description", "label"],
});
