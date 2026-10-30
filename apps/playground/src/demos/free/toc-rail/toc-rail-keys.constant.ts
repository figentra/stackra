/**
 * Stackra file contract:
 * Purpose: `TOC_RAIL_KEYS`, the typed keys of the web Table of contents demos' words in `assets/lang/<locale>/toc_rail.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The toc_rail namespace's keys. */
export const TOC_RAIL_KEYS = keys({
  toc_rail: [
    "label",
    "setup",
    "setup_text",
    "menu",
    "menu_text",
    "modifiers",
    "modifiers_text",
    "payments",
    "payments_text",
  ],
});
