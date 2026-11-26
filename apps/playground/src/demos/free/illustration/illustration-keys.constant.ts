/**
 * Stackra file contract:
 * Purpose: `ILLUSTRATION_KEYS`, the typed keys of the web Illustration demos' words in
 *          `assets/lang/<locale>/illustration.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The illustration namespace's keys. */
export const ILLUSTRATION_KEYS = keys({
  illustration: ["engine_alt", "try_title", "try_text"],
});
