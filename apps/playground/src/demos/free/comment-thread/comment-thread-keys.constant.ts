/**
 * Stackra file contract:
 * Purpose: `COMMENT_THREAD_KEYS`, the typed keys of the web Comment thread demos' words in `assets/lang/<locale>/comment_thread.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The comment_thread namespace's keys. */
export const COMMENT_THREAD_KEYS = keys({
  comment_thread: ["label", "sara", "omar", "lina", "first", "second"],
});
