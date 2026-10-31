/**
 * Stackra file contract:
 * Purpose: `FEATURE_SECTION_KEYS`, the typed keys of the web feature-section demo's words in `assets/lang/<locale>/feature_section.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const FEATURE_SECTION_KEYS = keys({
  feature_section: {
    basics: [
      "eyebrow",
      "title",
      "description",
      "payments",
      "payments_line",
      "shipping",
      "shipping_line",
      "languages",
      "languages_line",
      "insights",
      "insights_line",
      "security",
      "security_line",
      "support",
      "support_line",
    ],
  },
});
