/**
 * Stackra file contract:
 * Purpose: `PAGE_INDICATOR_KEYS`, the typed keys of the web PageIndicator demos' words in `assets/lang/<locale>/page_indicator.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const PAGE_INDICATOR_KEYS = keys({
  page_indicator: {
    onboarding: [
      "title_1",
      "body_1",
      "title_2",
      "body_2",
      "title_3",
      "body_3",
      "title_4",
      "body_4",
      "back",
      "next",
      "done",
      "label",
      "step",
    ],
    display_only: ["caption"],
  },
});
