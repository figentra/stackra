/**
 * Stackra file contract:
 * Purpose: `WORD_CLOUD_KEYS`, the typed keys of the web Word cloud demos' words in `assets/lang/<locale>/word_cloud.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The word_cloud namespace's keys. */
export const WORD_CLOUD_KEYS = keys({
  word_cloud: ["label", "delivery", "fresh", "price", "friendly", "fast", "late", "coffee", "clean", "app", "parking", "cold", "coupon", "staff", "quality", "queue", "music", "breakfast", "portion"],
});
