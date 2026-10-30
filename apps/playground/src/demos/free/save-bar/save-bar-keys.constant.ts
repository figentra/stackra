/**
 * Stackra file contract:
 * Purpose: `SAVE_BAR_KEYS`, the typed keys of the web SaveBar demos' words in `assets/lang/<locale>/save_bar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The save_bar namespace's keys. */
export const SAVE_BAR_KEYS = keys({
  save_bar: [
    "product_name",
    "sample_product",
    "message",
    "note",
    "fail_next",
    "leave",
    "blocked",
    "left",
  ],
});
