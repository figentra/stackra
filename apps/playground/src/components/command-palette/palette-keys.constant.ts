/**
 * Stackra file contract:
 * Purpose: `PALETTE_KEYS`, the typed keys of the command palette's own words in `assets/lang/<locale>/palette.json`:
 *          the group titles, the result count, the key hints and the preview's labels.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The palette namespace's keys. */
export const PALETTE_KEYS = keys({
  palette: {
    _: [
      "label",
      "results",
      "recent",
      "actions",
      "best",
      "count",
      "empty_hint",
      "component",
      "section",
      "category",
      "action",
      "open",
      "run",
      "move",
      "close",
      "platform",
    ],
  },
});
