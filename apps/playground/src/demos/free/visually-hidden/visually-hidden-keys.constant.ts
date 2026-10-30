/**
 * Stackra file contract:
 * Purpose: `VISUALLY_HIDDEN_KEYS`, the typed keys of the web VisuallyHidden demos' words in
 *          `assets/lang/<locale>/visually_hidden.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The visually_hidden namespace's keys. */
export const VISUALLY_HIDDEN_KEYS = keys({
  visually_hidden: [
    "return_policy",
    "delivery_times",
    "read_more",
    "about",
    "cart",
    "items_in_cart",
    "add_item",
    "product",
    "in_stock",
    "low_stock",
    "out_of_stock",
    "skip",
    "register",
    "register_body",
  ],
});
