/**
 * Stackra file contract:
 * Purpose: `MODAL_KEYS`, the typed keys of the web Modal demos' words in `assets/lang/<locale>/modal.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The modal namespace's keys. */
export const MODAL_KEYS = keys({
  modal: [
    "close",
    "done",
    "cancel",
    "save",
    "body",
    "size_title",
    "position_title",
    "dismissal_title",
    "open_small",
    "open_medium",
    "open_large",
    "open_full",
    "open_auto",
    "open_top",
    "open_center",
    "open_bottom",
    "open_default",
    "open_outside_off",
    "open_escape_off",
    "outside_off_body",
    "escape_off_body",
    "edit_name",
    "edit_title",
    "full_name",
    "current_name",
    "open_long",
    "long_title",
    "long_body",
    "motion_title",
    "motion_body",
    "open_slide_up",
    "open_stick_top",
    "open_slide_side",
  ],
});
