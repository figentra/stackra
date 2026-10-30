/**
 * Stackra file contract:
 * Purpose: `THUMBNAIL_DEMO_KEYS`, the typed keys of the native Thumbnail demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The thumbnail demos' keys. */
export const THUMBNAIL_DEMO_KEYS = keys({
  demo_free: {
    thumbnail: {
      sizes: ["sm", "md", "lg", "latte"],
      fallbacks: ["empty", "broken", "named", "latte"],
      menu_items: ["menu", "latte", "croissant", "shawarma", "drinks", "bakery", "mains"],
      blur_up: ["latte", "reload"],
    },
  },
});
