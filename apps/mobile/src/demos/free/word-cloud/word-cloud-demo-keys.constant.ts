/**
 * Stackra file contract:
 * Purpose: `WORD_CLOUD_DEMO_KEYS`, the typed keys of the native word cloud demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The word cloud demos' keys. */
export const WORD_CLOUD_DEMO_KEYS = keys({
  demo_free: {
    word_cloud: {
      reviews: ["label", "delivery", "fresh", "price", "friendly", "fast", "late", "coffee", "clean", "app", "parking", "cold", "coupon", "staff", "quality", "queue", "music", "breakfast", "portion"],
    },
  },
});
