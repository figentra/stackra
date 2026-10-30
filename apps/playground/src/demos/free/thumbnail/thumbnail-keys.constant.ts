/**
 * Stackra file contract:
 * Purpose: `THUMBNAIL_KEYS`, the typed keys of the web Thumbnail demos' words in `assets/lang/<locale>/thumbnail.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The thumbnail namespace's keys. */
export const THUMBNAIL_KEYS = keys({
  thumbnail: [
    "sm",
    "md",
    "lg",
    "empty",
    "broken",
    "named",
    "latte",
    "croissant",
    "shawarma",
    "menu",
    "reload",
    "drinks",
    "bakery",
    "mains",
  ],
});
