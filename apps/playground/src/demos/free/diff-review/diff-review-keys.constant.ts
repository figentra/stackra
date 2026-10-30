/**
 * Stackra file contract:
 * Purpose: `DIFF_REVIEW_KEYS`, the typed keys of the web Diff review demos' words in `assets/lang/<locale>/diff_review.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The diff_review namespace's keys. */
export const DIFF_REVIEW_KEYS = keys({
  diff_review: ["label", "price", "stock", "zone", "gulf", "applied"],
});
