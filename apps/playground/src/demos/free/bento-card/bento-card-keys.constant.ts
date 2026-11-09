/**
 * Stackra file contract:
 * Purpose: `BENTO_CARD_KEYS`, the typed keys of the web BentoCard demos' words in `assets/lang/<locale>/bento_card.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The bento_card namespace's keys. */
export const BENTO_CARD_KEYS = keys({
  bento_card: {
    feature: ["title", "description", "start", "docs", "seats", "seats_value"],
    brand: ["pay", "pay_description", "commerce", "commerce_description", "visit"],
  },
});
