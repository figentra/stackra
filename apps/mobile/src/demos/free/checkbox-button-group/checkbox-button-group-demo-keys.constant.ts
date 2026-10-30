/**
 * Stackra file contract:
 * Purpose: `CHECKBOX_BUTTON_GROUP_DEMO_KEYS`, the typed keys of the native Checkbox cards demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const CHECKBOX_BUTTON_GROUP_DEMO_KEYS = keys({
  demo_free: {
    checkbox_button_group: {
      basics: [
        "label",
        "hint",
        "store",
        "store_line",
        "online",
        "online_line",
        "apps",
        "apps_line",
      ],
    },
  },
});
