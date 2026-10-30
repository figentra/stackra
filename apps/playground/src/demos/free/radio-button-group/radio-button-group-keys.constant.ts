/**
 * Stackra file contract:
 * Purpose: `RADIO_BUTTON_GROUP_KEYS`, the typed keys of the web Radio cards demos' words in `assets/lang/<locale>/radio_button_group.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const RADIO_BUTTON_GROUP_KEYS = keys({
  radio_button_group: {
    basics: ["label", "starter", "starter_line", "growth", "growth_line", "scale", "scale_line"],
    horizontal: ["label", "pickup", "delivery"],
  },
});
