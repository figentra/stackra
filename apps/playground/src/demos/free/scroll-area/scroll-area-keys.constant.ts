/**
 * Stackra file contract:
 * Purpose: `SCROLL_AREA_KEYS`, the typed keys of the web Scroll area demos' words in `assets/lang/<locale>/scroll_area.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const SCROLL_AREA_KEYS = keys({
  scroll_area: {
    terms: ["label", "p1", "p2", "p3", "p4", "p5"],
    chips: ["label", "all", "dates", "coffee", "perfume", "abayas", "spices", "sweets", "gifts"],
    arabic: ["label", "all", "dates", "coffee", "perfume", "abayas", "spices", "sweets", "gifts"],
  },
});
