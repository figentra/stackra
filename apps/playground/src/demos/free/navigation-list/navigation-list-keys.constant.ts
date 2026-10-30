/**
 * Stackra file contract:
 * Purpose: `NAVIGATION_LIST_KEYS`, the typed keys of the web Navigation list demos' words in `assets/lang/<locale>/navigation_list.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The navigation_list namespace's keys. */
export const NAVIGATION_LIST_KEYS = keys({
  navigation_list: {
    _: [
      "basics_label",
      "home",
      "orders",
      "customers",
      "inbox",
      "current_label",
      "holding_label",
      "groups_label",
      "settings",
      "profile",
      "billing",
      "returns",
      "shipments",
      "badges_label",
      "states_label",
      "archive",
      "run_report",
      "press_count",
      "shortcuts_label",
      "compact_label",
      "arabic_label",
      "arabic_home",
      "arabic_orders",
      "arabic_customers",
      "live_label",
      "current_page",
    ],
    sample: ["new"],
  },
});
