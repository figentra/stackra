/**
 * Stackra file contract:
 * Purpose: `EXPORT_DIALOG_KEYS`, the typed keys of the ExportDialog's own words in `assets/lang/<locale>/ui.json` (`ui::export_dialog.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the gap
 *           components land without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The ExportDialog's keys. */
export const EXPORT_DIALOG_KEYS = keys({
  ui: {
    export_dialog: [
      "title",
      "format",
      "columns",
      "scope",
      "delivery",
      "scope_selection",
      "scope_filtered",
      "scope_all",
      "download",
      "email",
      "email_to",
      "cancel",
      "export",
      "done",
      "done_download",
      "done_email",
      "failed",
      "no_columns",
      "close",
      "preparing",
    ],
  },
});
