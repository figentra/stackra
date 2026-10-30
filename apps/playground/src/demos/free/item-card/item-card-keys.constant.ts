/**
 * Stackra file contract:
 * Purpose: `ITEM_CARD_KEYS`, the typed keys of the web Item card demos' words in `assets/lang/<locale>/item_card.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const ITEM_CARD_KEYS = keys({
  item_card: {
    basics: [
      "title",
      "footnote",
      "profile",
      "profile_line",
      "plan",
      "plan_value",
      "security",
      "pressed",
    ],
  },
});
