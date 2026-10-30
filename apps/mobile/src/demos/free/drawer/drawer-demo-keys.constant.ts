/**
 * Stackra file contract:
 * Purpose: `DRAWER_DEMO_KEYS`, the typed keys of the native drawer demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The drawer demos' keys. */
export const DRAWER_DEMO_KEYS = keys({
  demo_free: {
    drawer: {
      basics: ["open", "heading", "body", "close"],
      controlled: [
        "open",
        "heading",
        "body",
        "close",
        "cancel",
        "confirm",
        "is_open",
        "is_closed",
        "last",
        "none",
      ],
      locked: ["open", "heading", "body", "done"],
      form: ["open", "heading", "field", "initial", "close", "save", "saved", "none"],
      snap: ["open", "heading", "body", "close"],
      basic: ["open", "heading", "description", "first_name", "first_value", "email", "email_value", "close", "cancel", "save"],
      sizes: ["heading", "body", "sm", "md", "lg", "full", "close"],
      sub_header: ["open", "heading", "description", "sections", "details", "stock", "history", "details_body", "stock_body", "history_body", "close"],
      stepper: ["open", "heading", "step_of", "basics", "pricing", "review", "name", "name_value", "price", "price_value", "review_body", "back", "next", "finish", "cancel", "close"],
      stacked: ["open", "order", "order_body", "open_customer", "customer", "customer_body", "close"],
      views: ["open", "store", "store_description", "shipping", "payments", "shipping_body", "zone", "zone_body", "payments_body", "done", "close"],
      placement: ["start", "end", "bottom", "heading", "body", "close"],
    },
  },
});
