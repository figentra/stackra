/**
 * Stackra file contract:
 * Purpose: `TYPOGRAPHY_KEYS`, the typed keys of the web Typography demos' words in `assets/lang/<locale>/typography.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The typography namespace's keys. */
export const TYPOGRAPHY_KEYS = keys({
  typography: [
    "latin_sample",
    "arabic_sample",
    "long_sample",
    "level",
    "inline_before",
    "inline_text",
    "inline_after",
    "small",
    "next_tone",
    "state",
  ],
});
