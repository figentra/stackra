/**
 * Stackra file contract:
 * Purpose: `NOTIFICATIONS_PANEL_KEYS`, the typed keys of the web notifications-panel demos' words in `assets/lang/<locale>/notifications_panel.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 13; ADR 0080 (typed i18n keys); ADR 0060 (light, dark, RTL).
 */
import { keys } from "@stackra/i18n";

/** The notifications_panel namespace's keys. */
export const NOTIFICATIONS_PANEL_KEYS = keys({
  notifications_panel: [
    "today",
    "yesterday",
    "minutes_ago",
    "yesterday_at",
    "low_stock_title",
    "low_stock_detail",
    "order_title",
    "order_detail",
    "refund_title",
    "refund_detail",
    "shift_title",
    "shift_detail",
    "view_all",
    "simulate",
    "reset",
    "empty",
    "opened",
  ],
});
