/**
 * Stackra file contract:
 * Purpose: `CAROUSEL_KEYS`, the typed keys of the web Carousel demos' words in `assets/lang/<locale>/carousel.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The carousel namespace's keys. */
export const CAROUSEL_KEYS = keys({
  carousel: ["label", "one", "one_note", "two", "two_note", "three", "three_note"],
});
