/**
 * Stackra file contract:
 * Purpose: `CONTEXTUAL_HELP_KEYS`, the typed keys of the web Contextual help demos' words in `assets/lang/<locale>/contextual_help.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The contextual_help namespace's keys. */
export const CONTEXTUAL_HELP_KEYS = keys({
  contextual_help: [
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
});
