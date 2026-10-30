/**
 * Stackra file contract:
 * Purpose: `TAG_INPUT_KEYS`, the typed keys of the web Tag input demos' words in `assets/lang/<locale>/tag_input.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const TAG_INPUT_KEYS = keys({
  tag_input: {
    basics: ["label", "hint", "placeholder"],
    emails: ["label", "placeholder", "invalid"],
    arabic: ["label", "hint"],
  },
});
