/**
 * Stackra file contract:
 * Purpose: `WIDGET_FRAME_KEYS`, the typed keys of the web Widget frame demos' words in `assets/lang/<locale>/widget_frame.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The widget_frame namespace's keys. */
export const WIDGET_FRAME_KEYS = keys({
  widget_frame: ["sales", "range", "visits", "refunds", "view_all", "trend"],
});
