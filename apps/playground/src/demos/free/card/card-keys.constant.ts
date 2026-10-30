/**
 * Stackra file contract:
 * Purpose: `CARD_KEYS`, the typed keys of the web Card demos' words in `assets/lang/<locale>/card.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The card namespace's keys. */
export const CARD_KEYS = keys({
  card: [
    "level_title",
    "level_description",
    "level_content",
    "anatomy_title",
    "anatomy_description",
    "anatomy_content",
    "pay",
    "later",
    "outer_title",
    "outer_description",
    "inner_title",
    "inner_content",
    "named_title",
    "named_content",
    "horizontal_title",
    "horizontal_content",
    "dismissible_title",
    "dismissible_content",
    "dismiss",
    "show_again",
    "hidden",
  ],
});
