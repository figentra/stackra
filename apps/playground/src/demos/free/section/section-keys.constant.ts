/**
 * Stackra file contract:
 * Purpose: `SECTION_KEYS`, the typed keys of the web Section demos' words in `assets/lang/<locale>/section.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The section namespace's keys. */
export const SECTION_KEYS = keys({
  section: [
    "title_only",
    "description",
    "body",
    "start",
    "every",
    "one",
    "three",
    "six",
    "danger",
    "link",
    "same_title",
    "title_only_title",
    "description_title",
    "description_line",
    "body_title",
    "start_title",
    "every_title",
    "every_line",
    "one_title",
    "three_title",
    "six_title",
    "danger_title",
    "link_title",
    "address",
    "billing_address",
    "shipping_address",
    "live_title",
    "live_line",
    "viewing",
    "editing",
    "create",
    "edit",
    "done",
    "export",
    "duplicate",
    "print",
    "archive",
    "delete",
    "copy",
    "open_app",
    "more_actions",
    "paid",
    "placed_by",
    "email",
    "email_value",
    "phone",
    "phone_value",
    "items",
    "action_status",
    "arabic_title",
    "arabic_line",
    "arabic_body",
    "arabic_edit",
    "arabic_export",
  ],
});
