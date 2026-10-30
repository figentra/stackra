/**
 * Stackra file contract:
 * Purpose: `FILE_TRIGGER_KEYS`, the typed keys of the web FileTrigger demos' words in `assets/lang/<locale>/file_trigger.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The file_trigger namespace's keys. */
export const FILE_TRIGGER_KEYS = keys({
  file_trigger: ["receipt", "picked", "list"],
});
