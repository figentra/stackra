/**
 * Stackra file contract:
 * Purpose: `SWIPEABLE_TABS_KEYS`, the typed keys of the web Swipeable tabs demos' words in `assets/lang/<locale>/swipeable_tabs.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The swipeable_tabs namespace's keys. */
export const SWIPEABLE_TABS_KEYS = keys({
  swipeable_tabs: [
    "label",
    "new",
    "preparing",
    "ready",
    "new_body",
    "preparing_body",
    "ready_body",
    "hint",
  ],
});
