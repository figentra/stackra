/**
 * Stackra file contract:
 * Purpose: `SOURCES_KEYS`, the typed keys of the web Sources demos' words in `assets/lang/<locale>/sources.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const SOURCES_KEYS = keys({
  sources: {
    answer: ["text", "zatca", "zatca_note", "gazette", "handbook"],
    chips: ["before", "after"],
  },
});
