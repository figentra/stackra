/**
 * Stackra file contract:
 * Purpose: `SPLIT_VIEW_KEYS`, the typed keys of the web Split view demos' words in `assets/lang/<locale>/split_view.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The split_view namespace's keys. */
export const SPLIT_VIEW_KEYS = keys({
  split_view: ["orders", "details", "order", "ready", "pick", "back"],
});
