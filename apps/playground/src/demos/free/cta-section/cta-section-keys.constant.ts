/**
 * Stackra file contract:
 * Purpose: `CTA_SECTION_KEYS`, the typed keys of the web cta-section demo's words in `assets/lang/<locale>/cta_section.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const CTA_SECTION_KEYS = keys({
  cta_section: {
    basics: [
      "title",
      "description",
      "start",
      "demo",
      "news_title",
      "news_label",
      "news_placeholder",
      "news_submit",
      "news_note",
      "news_thanks",
      "pressed",
    ],
  },
});
