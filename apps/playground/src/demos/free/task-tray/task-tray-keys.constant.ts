/**
 * Stackra file contract:
 * Purpose: `TASK_TRAY_KEYS`, the typed keys of the web TaskTray demos' words in `assets/lang/<locale>/task_tray.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const TASK_TRAY_KEYS = keys({
  task_tray: {
    _: ["start", "fail", "export", "import", "upload", "rows", "no_phone"],
    rtl: ["label", "export", "import", "upload", "no_phone"],
  },
});
