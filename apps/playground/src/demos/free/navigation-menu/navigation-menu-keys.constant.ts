/**
 * Stackra file contract:
 * Purpose: `NAVIGATION_MENU_KEYS`, the typed keys of the web NavigationMenu demos' words in
 *          `assets/lang/<locale>/navigation_menu.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const NAVIGATION_MENU_KEYS = keys({
  navigation_menu: {
    basics: [
      "label",
      "products",
      "pos",
      "pos_note",
      "store",
      "store_note",
      "payments",
      "payments_note",
      "pricing",
      "resources",
      "guides",
      "guides_note",
      "help",
      "help_note",
    ],
    mega: [
      "label",
      "sell",
      "shipping",
      "shipping_note",
      "invoices",
      "invoices_note",
      "reports",
      "reports_note",
      "customers",
      "settings",
    ],
  },
});
