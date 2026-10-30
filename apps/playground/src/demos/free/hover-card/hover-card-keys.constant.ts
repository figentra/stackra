/**
 * Stackra file contract:
 * Purpose: `HOVER_CARD_KEYS`, the typed keys of the web Hover card demos' words in `assets/lang/<locale>/hover_card.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The hover_card namespace's keys. */
export const HOVER_CARD_KEYS = keys({
  hover_card: ["label", "name", "role", "orders", "rating", "lead"],
});
