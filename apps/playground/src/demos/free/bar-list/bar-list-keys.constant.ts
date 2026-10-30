/**
 * Stackra file contract:
 * Purpose: `BAR_LIST_KEYS`, the typed keys of the web Bar list demos' words in `assets/lang/<locale>/bar_list.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const BAR_LIST_KEYS = keys({
  bar_list: {
    cities: ["label", "riyadh", "jeddah", "dammam", "makkah", "abha"],
    sources: ["label", "search", "direct", "social", "email"],
    arabic: ["label", "riyadh", "jeddah", "dammam"],
  },
});
