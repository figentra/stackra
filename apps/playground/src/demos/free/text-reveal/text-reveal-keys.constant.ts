/**
 * Stackra file contract:
 * Purpose: `TEXT_REVEAL_KEYS`, the typed keys of the web TextReveal demos' words in
 *          `assets/lang/<locale>/text_reveal.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The text_reveal namespace's keys. */
export const TEXT_REVEAL_KEYS = keys({
  text_reveal: ["headline", "replay"],
});
