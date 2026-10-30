/**
 * Stackra file contract:
 * Purpose: `STEPPER_KEYS`, the typed keys of the web Stepper demos' words in `assets/lang/<locale>/stepper.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const STEPPER_KEYS = keys({
  stepper: {
    horizontal: ["label", "cart", "shipping", "payment", "review", "back", "next", "place"],
    vertical: [
      "label",
      "profile",
      "profile_note",
      "products",
      "products_note",
      "payments",
      "payments_note",
      "domain",
      "launch",
    ],
    error: ["label", "upload", "columns", "rows", "rows_note", "import"],
    compact: ["label", "basics", "pricing", "stock", "review", "back", "next"],
    drawer: [
      "open",
      "title",
      "label",
      "customer",
      "items",
      "delivery",
      "customer_name",
      "customer_value",
      "item",
      "item_value",
      "delivery_body",
      "back",
      "next",
      "create",
      "cancel",
      "close",
    ],
    rtl: ["label", "cart", "shipping", "payment", "review"],
  },
});
