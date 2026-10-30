/**
 * Stackra file contract:
 * Purpose: `LIST_KEYS`, the typed keys of the web List demos' words in `assets/lang/<locale>/list.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The list namespace's keys. */
export const LIST_KEYS = keys({
  list: {
    _: [
      "basics_label",
      "slots_label",
      "surface",
      "press_label",
      "disabled_label",
      "single_label",
      "multiple_label",
      "empty_label",
      "empty",
      "loading_label",
      "loading",
      "live_select_label",
      "live_more_label",
      "scroll_region",
      "pressed",
      "none_pressed",
      "selected",
      "rows",
    ],
    sample: [
      "order_1042",
      "shipped_on_monday",
      "order_1043",
      "waiting_for_payment",
      "order_1044",
      "a_moment_ago",
      "email",
      "daily_summary",
      "push",
      "as_it_happens",
      "sms",
      "urgent_only",
      "chat",
      "mentions",
      "profile",
      "billing",
      "plans_and_invoices",
      "profile_disabled",
      "billing_disabled",
      "engineering",
      "active",
      "head_office",
      "cairo",
      "alerts",
    ],
  },
});
