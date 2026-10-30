/**
 * Stackra file contract:
 * Purpose: `SEPARATOR_KEYS`, the typed keys of the web Separator demos' words in `assets/lang/<locale>/separator.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The separator namespace's keys. */
export const SEPARATOR_KEYS = keys({
  separator: {
    _: [
      "before",
      "after",
      "level",
      "links",
      "group_name",
      "rule_name",
      "bold",
      "italic",
      "left",
      "right",
      "turn",
      "orientation",
      "block_a",
      "block_b",
    ],
    sample: ["foundations", "typography", "card"],
  },
});
