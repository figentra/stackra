/**
 * Stackra file contract:
 * Purpose: `TURNSTILE_KEYS`, the typed keys of the web Turnstile demos' words in `assets/lang/<locale>/turnstile.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The turnstile namespace's keys. */
export const TURNSTILE_KEYS = keys({
  turnstile: ["email", "send", "sent", "not_sent", "test_key", "blocked_key", "waiting", "refused"],
});
