/**
 * Stackra file contract:
 * Purpose: `SCHEMATIC_KEYS`, the typed keys of the web Schematic demos' words in `assets/lang/<locale>/schematic.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The schematic namespace's keys. */
export const SCHEMATIC_KEYS = keys({
  schematic: [
    "split_label",
    "action",
    "endpoint",
    "tool",
    "job",
    "chain_label",
    "model",
    "gen",
    "manifest",
  ],
});
