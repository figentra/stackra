/**
 * Stackra file contract:
 * Purpose: `ASPECT_RATIO_KEYS`, the typed keys of the web AspectRatio demos' words in `assets/lang/<locale>/aspect_ratio.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const ASPECT_RATIO_KEYS = keys({
  aspect_ratio: {
    product_photo: ["price_1", "price_2", "price_3"],
    video: ["title", "duration"],
  },
});
