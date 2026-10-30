/**
 * Stackra file contract:
 * Purpose: `MULTI_SELECT_KEYS`, the typed keys of the web Multi-select demos' words in `assets/lang/<locale>/multi_select.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The multi_select namespace's keys. */
export const MULTI_SELECT_KEYS = keys({
  multi_select: [
    "collections",
    "collections_hint",
    "placeholder",
    "empty",
    "remove",
    "summer",
    "ramadan",
    "new",
    "best",
    "gifts",
    "eid",
    "dietary",
    "halal",
    "vegan",
    "gluten",
    "spicy",
    "nuts",
    "read_only",
    "disabled",
    "invalid",
    "chosen",
    "clear",
  ],
});
