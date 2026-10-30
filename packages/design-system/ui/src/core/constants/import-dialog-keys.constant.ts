/**
 * Stackra file contract:
 * Purpose: `IMPORT_DIALOG_KEYS`, the typed keys of the ImportDialog's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::import_dialog.*`); the mapping and review words are ImportFlow's (`ui::import_flow.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS`, as the ExportDialog's
 *           are, so it lands without editing the shared key list.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The ImportDialog's keys. */
export const IMPORT_DIALOG_KEYS = keys({
  ui: {
    import_dialog: [
      "title",
      "close",
      "step_of",
      "step_upload",
      "step_match",
      "step_review",
      "step_import",
      "upload_label",
      "upload_hint",
      "template",
      "reading",
      "read_failed",
      "file_rows",
      "check_failed",
      "skipped",
      "download_errors",
      "error_row",
      "error_field",
      "error_message",
      "importing",
      "done_title",
      "import_failed",
      "cancel",
      "back",
      "next",
      "retry",
      "done",
      "done_created",
      "done_updated",
      "done_skipped",
      "done_failed",
    ],
  },
});
