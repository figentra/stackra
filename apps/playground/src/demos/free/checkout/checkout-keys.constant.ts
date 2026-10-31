/**
 * Stackra file contract:
 * Purpose: `CHECKOUT_KEYS`, the typed keys of the web checkout demo's words in `assets/lang/<locale>/checkout.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const CHECKOUT_KEYS = keys({
  checkout: {
    basics: [
      "contact",
      "email",
      "phone",
      "address",
      "name",
      "street",
      "district",
      "city",
      "shipping",
      "standard",
      "standard_line",
      "express",
      "express_line",
      "payment",
      "card",
      "card_line",
      "cod",
      "summary",
      "place",
      "abaya",
      "scarf",
      "subtotal",
      "vat",
      "total",
      "placed",
    ],
  },
});
