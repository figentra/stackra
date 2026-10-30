/**
 * Stackra file contract:
 * Purpose: `IMPORT_FLOW_KEYS`, the typed keys of the web Import flow demos' words in `assets/lang/<locale>/import_flow.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The import_flow namespace's keys. */
export const IMPORT_FLOW_KEYS = keys({
  import_flow: ["name", "email", "phone", "city", "bad_email", "done"],
});
