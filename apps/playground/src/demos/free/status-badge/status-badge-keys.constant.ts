/**
 * Stackra file contract:
 * Purpose: `STATUS_BADGE_KEYS`, the typed keys of the web Status badge demos' words in `assets/lang/<locale>/status_badge.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The status_badge namespace's keys. */
export const STATUS_BADGE_KEYS = keys({
  status_badge: ["size", "caption", "order", "status", "advance"],
});
