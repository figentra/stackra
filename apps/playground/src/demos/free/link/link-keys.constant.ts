/**
 * Stackra file contract:
 * Purpose: `LINK_KEYS`, the typed keys of the web Link demos' words in `assets/lang/<locale>/link.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The link namespace's keys. */
export const LINK_KEYS = keys({
  link: [
    "hover",
    "always",
    "before_links",
    "after_links",
    "external_text",
    "external_label",
    "router_link",
    "disabled_link",
    "press_link",
    "press_count",
    "settings_label",
    "arabic",
    "arabic_link_text",
    "arabic_sentence_end",
  ],
});
