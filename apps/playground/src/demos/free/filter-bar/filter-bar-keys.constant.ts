/**
 * Stackra file contract:
 * Purpose: `FILTER_BAR_KEYS`, the typed keys of the web Filter bar demos' words in `assets/lang/<locale>/filter_bar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The filter_bar namespace's keys. */
export const FILTER_BAR_KEYS = keys({
  filter_bar: {
    _: [
      "basics_search",
      "basics_placeholder",
      "kinds_list",
      "applied",
      "applied_search",
      "disabled",
      "disabled_search",
      "disabled_note",
      "all_applied",
      "all_applied_search",
      "unapplied",
      "unapplied_search",
      "unapplied_note",
      "live_search",
      "live_placeholder",
      "results",
      "count",
      "none",
      "query",
      "nothing",
    ],
    kind_rows: ["choice", "text", "number", "date", "boolean"],
    sample: [
      "status",
      "paid",
      "shipped",
      "refunded",
      "region",
      "europe",
      "united_states",
      "asia_pacific",
      "customer",
      "total",
      "placed",
      "gift_order",
    ],
  },
});
