/**
 * Stackra file contract:
 * Purpose: `MARQUEE_DEMO_KEYS`, the typed keys of the native Marquee demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const MARQUEE_DEMO_KEYS = keys({
  demo_free: {
    marquee: {
      brands: ["label", "brand_1", "brand_2", "brand_3", "brand_4", "brand_5", "brand_6"],
      announcements: ["label", "item_1", "item_2", "item_3", "item_4"],
    },
  },
});
