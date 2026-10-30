/**
 * Stackra file contract:
 * Purpose: `VISUALLY_HIDDEN_DEMO_KEYS`, the typed keys of the native visually-hidden demos' words in
 *          `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The visually-hidden demos' keys. */
export const VISUALLY_HIDDEN_DEMO_KEYS = keys({
  demo_free: {
    visually_hidden: {
      icon_context: ["heading", "context"],
      cart_count: ["cart", "items_in_cart", "add_item"],
      stock_status: ["product", "in_stock", "low_stock", "out_of_stock"],
    },
  },
});
