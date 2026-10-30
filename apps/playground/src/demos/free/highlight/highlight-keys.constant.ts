/**
 * Stackra file contract:
 * Purpose: `HIGHLIGHT_KEYS`, the typed keys of the web Highlight demos' words in `assets/lang/<locale>/highlight.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const HIGHLIGHT_KEYS = keys({
  highlight: {
    search: ["label", "query", "r1", "r2", "r3", "r4"],
    terms: ["text", "a", "b"],
    arabic: ["query", "text"],
  },
});
