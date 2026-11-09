/**
 * Stackra file contract:
 * Purpose: `AUTOCOMPLETE_KEYS`, the typed keys of the web Autocomplete demos' words in `assets/lang/<locale>/autocomplete.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The autocomplete namespace's keys. */
export const AUTOCOMPLETE_KEYS = keys({
  autocomplete: {
    basics: ["label", "placeholder", "description", "search", "clear", "empty", "chosen", "none"],
    sample: [
      "saudi_arabia",
      "united_arab_emirates",
      "egypt",
      "jordan",
      "kuwait",
      "qatar",
      "bahrain",
      "oman",
      "united_kingdom",
      "germany",
      "united_states",
    ],
  },
});
