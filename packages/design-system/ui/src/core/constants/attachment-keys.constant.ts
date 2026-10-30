/**
 * Stackra file contract:
 * Purpose: `ATTACHMENT_KEYS`, the typed keys of the AttachmentCard's and the ShareButton's own words in
 *          `assets/lang/<locale>/ui.json` (`ui::attachment_card.*`, `ui::share_button.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the wave C
 *           components land without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The AttachmentCard's and ShareButton's keys. */
export const ATTACHMENT_KEYS = keys({
  ui: {
    attachment_card: ["remove", "download", "open", "uploading", "failed", "retry"],
    share_button: ["share", "copied", "copy_link"],
  },
});
