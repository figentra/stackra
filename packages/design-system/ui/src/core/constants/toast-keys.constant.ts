/**
 * Stackra file contract:
 * Purpose: `TOAST_KEYS`, the typed keys of the toasts' own words in `assets/lang/<locale>/ui.json` (`ui::toast.*`):
 *          the undo toast's "Undo".
 * Boundary: internal: the web and native toasts import it by path; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The toasts' keys. */
export const TOAST_KEYS = keys({
  ui: { toast: ["undo"] },
});
