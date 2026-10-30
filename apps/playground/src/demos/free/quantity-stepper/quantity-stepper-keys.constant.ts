/**
 * Stackra file contract:
 * Purpose: `QUANTITY_STEPPER_KEYS`, the typed keys of the web Quantity stepper demos' words in `assets/lang/<locale>/quantity_stepper.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The quantity_stepper namespace's keys. */
export const QUANTITY_STEPPER_KEYS = keys({
  quantity_stepper: ["item", "qty", "removed", "undo"],
});
