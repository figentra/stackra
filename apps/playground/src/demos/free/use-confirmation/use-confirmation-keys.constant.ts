/**
 * Stackra file contract:
 * Purpose: `USE_CONFIRMATION_KEYS`, the typed keys of the web Use confirmation demos' words in `assets/lang/<locale>/use_confirmation.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The use_confirmation namespace's keys. */
export const USE_CONFIRMATION_KEYS = keys({
  use_confirmation: {
    _: ["plain", "danger", "typed", "no_answer", "yes", "no", "deleted"],
    plain_dialog: ["title", "description", "confirm", "cancel"],
    danger_dialog: ["title", "description", "confirm", "cancel"],
    typed_dialog: ["title", "description", "confirm", "cancel", "confirmation"],
  },
});
