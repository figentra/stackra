/**
 * Stackra file contract:
 * Purpose: `TASK_TRAY_KEYS`, the typed keys of TaskTray's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::task_tray.*`): the tray's name, the header's counts, the show/hide toggle and each task's buttons and
 *          states.
 * Boundary: internal: the web and native TaskTray import it by path; no entry exports it. Kept apart from `UI_KEYS`
 *           so parallel builds never edit one shared file.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The typed keys of TaskTray's own words. */
export const TASK_TRAY_KEYS = keys({
  ui: {
    task_tray: [
      "label",
      "running",
      "finished",
      "failed",
      "show",
      "hide",
      "clear",
      "cancel",
      "retry",
      "dismiss",
      "queued",
      "done",
      "error",
      "canceled",
    ],
  },
});
