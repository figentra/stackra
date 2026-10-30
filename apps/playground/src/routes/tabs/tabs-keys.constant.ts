/**
 * Stackra file contract:
 * Purpose: `TABS_KEYS`, the typed keys of the tabs demos' words in `assets/lang/<locale>/tabs.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tabs namespace's keys. */
export const TABS_KEYS = keys({
  tabs: {
    sections: {
      overview: ["label", "content"],
      items: ["label", "content"],
      history: ["label", "content"],
    },
    basics: ["label"],
    variants: ["primary", "secondary"],
    orientation: ["horizontal", "vertical"],
    states: ["disabled_tab", "disabled_list"],
    empty: ["message", "loading"],
    live: ["label", "show_history", "show_overview", "selected", "none"],
    closable: ["label", "add", "draft", "orders", "returns", "customers", "empty"],
    overflow: [
      "label",
      "sales",
      "orders",
      "returns",
      "customers",
      "inventory",
      "payouts",
      "taxes",
      "shipping",
      "content",
    ],
  },
});
