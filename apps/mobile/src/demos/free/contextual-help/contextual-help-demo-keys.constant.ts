/**
 * Stackra file contract:
 * Purpose: `CONTEXTUAL_HELP_DEMO_KEYS`, the typed keys of the native Contextual help demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The contextual_help demos' keys. */
export const CONTEXTUAL_HELP_DEMO_KEYS = keys({
  demo_free: {
    contextual_help: {
      sample: [
        "prices_heading",
        "prices_label",
        "prices_title",
        "prices_body",
        "float_heading",
        "float_label",
        "float_body",
        "sku_label_text",
        "sku_label",
        "sku_title",
        "sku_body",
        "sku_example",
      ],
    },
  },
});
