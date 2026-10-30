/**
 * Stackra file contract:
 * Purpose: `PAGE_SKELETON_KEYS`, the typed keys of the web Page skeleton demos' words in `assets/lang/<locale>/page_skeleton.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The page_skeleton namespace's keys. */
export const PAGE_SKELETON_KEYS = keys({
  page_skeleton: ["region_name", "reload", "loading_orders"],
});
