/**
 * Stackra file contract:
 * Purpose: `COACH_MARK_KEYS`, the typed keys of the web CoachMark demos' words in `assets/lang/<locale>/coach_mark.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The coach_mark namespace's keys. */
export const COACH_MARK_KEYS = keys({
  coach_mark: {
    _: ["start", "outcome_done", "outcome_skipped"],
    pos: [
      "scan",
      "scan_title",
      "scan_text",
      "basket",
      "basket_title",
      "basket_text",
      "pay",
      "pay_title",
      "pay_text",
    ],
    admin: [
      "navigation",
      "orders",
      "orders_title",
      "orders_text",
      "products",
      "products_title",
      "products_text",
      "reports",
      "reports_title",
      "reports_text",
    ],
  },
});
