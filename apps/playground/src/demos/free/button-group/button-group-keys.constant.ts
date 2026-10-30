/**
 * Stackra file contract:
 * Purpose: `BUTTON_GROUP_KEYS`, the typed keys of the web Button group demos' words in `assets/lang/<locale>/button_group.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const BUTTON_GROUP_KEYS = keys({
  button_group: {
    period: ["label", "day", "week", "month"],
    actions: ["label", "edit", "duplicate", "export"],
    arabic: ["label", "day", "week", "month"],
  },
});
