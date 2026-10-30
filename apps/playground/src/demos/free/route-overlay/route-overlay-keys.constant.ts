/**
 * Stackra file contract:
 * Purpose: `ROUTE_OVERLAY_KEYS`, the typed keys of the web Route overlay demos' words in `assets/lang/<locale>/route_overlay.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The route_overlay namespace's keys. */
export const ROUTE_OVERLAY_KEYS = keys({
  route_overlay: [
    "open_modal",
    "open_sheet",
    "open_drawer",
    "open_full_screen",
    "open_by_link",
    "modal_title",
    "sheet_title",
    "drawer_title",
    "full_screen_title",
    "body",
    "close",
    "cancel",
    "open_locked",
    "locked_title",
    "locked_on",
    "locked_off",
    "allow",
    "lock",
    "open_edit",
    "edit_title",
    "name_label",
    "save",
    "saved_name",
    "route_is",
    "leave_title",
    "leave_description",
    "stay",
    "discard",
    "open_order",
    "order_title",
    "order_body",
    "open_customer",
    "customer_title",
    "customer_body",
    "open_address",
    "address_title",
    "address_body",
  ],
});
