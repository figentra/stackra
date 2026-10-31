/**
 * Stackra file contract:
 * Purpose: `REASONING_KEYS`, the typed keys of the web Reasoning demos' words in `assets/lang/<locale>/reasoning.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const REASONING_KEYS = keys({
  reasoning: {
    trace: ["summary", "search_label", "search", "compare_label", "compare", "check"],
    streaming: ["step"],
  },
});
