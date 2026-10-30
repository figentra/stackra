/**
 * Stackra file contract:
 * Purpose: `SKELETON_KEYS`, the typed keys of the web Skeleton demos' words in `assets/lang/<locale>/skeleton.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The skeleton namespace's keys. */
export const SKELETON_KEYS = keys({
  skeleton: ["grouped", "lone", "loading_profile", "reload", "name", "handle"],
});
