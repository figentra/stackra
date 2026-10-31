/**
 * Stackra file contract:
 * Purpose: `CART_KEYS`, the typed keys of the web cart demo's words in `assets/lang/<locale>/cart.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const CART_KEYS = keys({
  cart: {
    basics: [
      "title",
      "empty",
      "quantity",
      "remove",
      "checkout",
      "abaya",
      "abaya_detail",
      "scarf",
      "scarf_detail",
      "subtotal",
      "shipping",
      "vat",
      "total",
    ],
  },
});
