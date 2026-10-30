/**
 * Stackra file contract:
 * Purpose: `EMPTY_STATE_KEYS`, the typed keys of the web Empty state demos' words in `assets/lang/<locale>/empty_state.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The empty_state namespace's keys. */
export const EMPTY_STATE_KEYS = keys({
  empty_state: {
    _: [
      "search_label",
      "search_placeholder",
      "clear_search",
      "show_all",
      "results_intro",
      "create",
      "clear_filters",
      "learn_more",
      "count",
    ],
    sample: [
      "no_orders_yet",
      "orders_appear_here_once_a",
      "no_orders_match_your_filters",
      "try_a_different_status_or",
      "you_cannot_see_orders",
      "ask_an_administrator_to_give",
      "title_only",
      "with_an_action",
      "an_icon_of_your_own",
      "importing_is_paused",
      "orders_will_appear_here_when",
      "no_icon",
    ],
  },
});
