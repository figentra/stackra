/**
 * Stackra file contract:
 * Purpose: `FOUNDATIONS_KEYS`, the typed keys of the web Foundations demos' words in `assets/lang/<locale>/foundations.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The foundations namespace's keys. */
export const FOUNDATIONS_KEYS = keys({
  foundations: {
    _: ["colors_note", "no_pair", "latin_sample", "arabic_sample", "name", "duration", "easing"],
    groups: ["surfaces", "content", "status", "fields", "controls", "utility"],
  },
});
