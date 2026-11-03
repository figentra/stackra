/**
 * Stackra file contract:
 * Purpose: `RESOURCE_PAGES_DEMO_KEYS`, the typed keys of the native resource page demos' words in
 *          `assets/lang/<locale>/demo_free.json`: the demo shop's product labels (shared by the List, View and Form
 *          demos) and the action modal demo's own words.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const RESOURCE_PAGES_DEMO_KEYS = keys({
  demo_free: {
    resource_list_page: {
      basics: ["title", "id", "name", "stock", "status", "active", "draft"],
    },
    action_input_modal: {
      basics: ["open", "restock", "quantity", "note"],
    },
  },
});
