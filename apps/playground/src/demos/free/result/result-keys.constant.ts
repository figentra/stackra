/**
 * Stackra file contract:
 * Purpose: `RESULT_KEYS`, the typed keys of the web Result demos' words in `assets/lang/<locale>/result.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const RESULT_KEYS = keys({
  result: {
    paid: ["title", "description", "receipt", "back"],
    states: [
      "pending",
      "pending_description",
      "error",
      "error_description",
      "info",
      "info_description",
      "again",
      "show_error",
      "show_info",
    ],
    arabic: ["title", "description", "receipt", "back"],
  },
});
