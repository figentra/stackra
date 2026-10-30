/**
 * Stackra file contract:
 * Purpose: `MENTION_INPUT_KEYS`, the typed keys of the web MentionInput demos' words in `assets/lang/<locale>/mention_input.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const MENTION_INPUT_KEYS = keys({
  mention_input: {
    basics: ["label", "placeholder", "description", "mentioned", "nobody"],
  },
});
