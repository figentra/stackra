/**
 * Stackra file contract:
 * Purpose: `TABS_DEMO_KEYS`, the typed keys of the native tabs demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The tabs demos' keys. */
export const TABS_DEMO_KEYS = keys({
  demo_free: {
    tabs: {
      basics: ["label"],
      empty: ["body", "heading", "label", "loading", "loading_label"],
      live: ["label", "none", "selected"],
      sections: ["history", "history_body", "items", "items_body", "overview", "overview_body"],
      states: [
        "billing",
        "billing_body",
        "disabled",
        "disabled_label",
        "label",
        "profile",
        "profile_body",
        "security",
        "security_body",
      ],
      variants: ["label"],
      closable: ["label", "orders", "returns", "customers", "add", "draft", "empty"],
    },
  },
});
