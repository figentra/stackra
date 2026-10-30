/**
 * Stackra file contract:
 * Purpose: `HOLO_CARD_KEYS`, the typed keys of the web Holo card demos' words in `assets/lang/<locale>/holo_card.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The holo_card namespace's keys. */
export const HOLO_CARD_KEYS = keys({
  holo_card: ["tier", "name", "points", "since"],
});
