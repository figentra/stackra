/**
 * Stackra file contract:
 * Purpose: `FLAG_KEYS`, the typed keys of the web Flag demos' words in `assets/lang/<locale>/flag.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The flag namespace's keys. */
export const FLAG_KEYS = keys({
  flag: {
    basics: [
      "sizes",
      "countries",
      "tags",
      "saudi_arabia",
      "united_arab_emirates",
      "egypt",
      "united_kingdom",
      "arabic_saudi_arabia",
      "serbian_latin",
    ],
  },
});
