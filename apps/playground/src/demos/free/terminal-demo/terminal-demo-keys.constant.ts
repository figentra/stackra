/**
 * Stackra file contract:
 * Purpose: `TERMINAL_DEMO_KEYS`, the typed keys of the web TerminalDemo demos' words in
 *          `assets/lang/<locale>/terminal_demo.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The terminal_demo namespace's keys. */
export const TERMINAL_DEMO_KEYS = keys({
  terminal_demo: ["running", "verify_label", "copy"],
});
