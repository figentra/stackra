/**
 * Stackra file contract:
 * Purpose: `SIDE_PANEL_KEYS`, the typed keys of the web SidePanel demos' words in `assets/lang/<locale>/side_panel.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The side_panel namespace's keys. */
export const SIDE_PANEL_KEYS = keys({
  side_panel: [
    "assistant_label",
    "launcher",
    "ask",
    "send",
    "recent",
    "welcome",
    "welcome_hint",
    "page_title",
    "page_text",
    "inspector_label",
    "inspector_title",
    "toggle_inspector",
    "customer",
    "customer_value",
    "status",
    "status_value",
    "total",
    "total_value",
    "resizable_label",
    "notes",
    "notes_text",
    "resize_hint",
    "width",
    "expand_hint",
    "controlled_label",
    "activity",
    "activity_text",
    "state",
    "state_closed",
    "state_open",
    "state_expanded",
    "split_label",
    "comments",
    "comments_text",
    "arabic_label",
    "arabic_launcher",
    "arabic_ask",
    "arabic_recent",
    "arabic_welcome",
    "arabic_page_title",
    "arabic_page_text",
  ],
});
