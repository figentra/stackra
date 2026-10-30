/**
 * Stackra file contract:
 * Purpose: `CHIP_KEYS`, the typed keys of the web Chip demos' words in `assets/lang/<locale>/chip.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The chip namespace's keys. */
export const CHIP_KEYS = keys({
  chip: [
    "size",
    "variant_column",
    "start",
    "end",
    "both",
    "sentence_prefix",
    "sentence_suffix",
    "sentence_chip",
    "categories",
    "next_variant",
    "next_tone",
    "current",
  ],
});
