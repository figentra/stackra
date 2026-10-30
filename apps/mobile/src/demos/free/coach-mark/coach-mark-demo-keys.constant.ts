/**
 * Stackra file contract:
 * Purpose: `COACH_MARK_DEMO_KEYS`, the typed keys of the native CoachMark demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The coach-mark demos' keys. */
export const COACH_MARK_DEMO_KEYS = keys({
  demo_free: {
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
  },
});
