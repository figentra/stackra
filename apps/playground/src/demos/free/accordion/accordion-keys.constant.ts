/**
 * Stackra file contract:
 * Purpose: `ACCORDION_KEYS`, the typed keys of the web Accordion demos' words in `assets/lang/<locale>/accordion.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The accordion namespace's keys. */
export const ACCORDION_KEYS = keys({
  accordion: {
    _: ["variant", "open", "expand_all", "collapse_all", "docs_link"],
    sample: [
      "how_long_does_shipping_take",
      "orders_ship_within_two_working",
      "can_i_return_an_order",
      "yes_within_thirty_days_and",
      "is_there_a_warranty",
      "every_product_has_a_two",
    ],
  },
});
