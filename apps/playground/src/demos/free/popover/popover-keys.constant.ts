/**
 * Stackra file contract:
 * Purpose: `POPOVER_KEYS`, the typed keys of the web Popover demos' words in `assets/lang/<locale>/popover.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The popover namespace's keys. */
export const POPOVER_KEYS = keys({
  popover: [
    "top",
    "bottom",
    "start",
    "end",
    "side_title",
    "side_body",
    "align_start",
    "align_center",
    "align_end",
    "align_title",
    "align_body",
    "titled",
    "titled_title",
    "titled_body",
    "arrow",
    "arrow_title",
    "arrow_body",
    "named",
    "named_label",
    "named_body",
    "form",
    "form_title",
    "form_field",
    "form_save",
    "dismissable",
    "dismissable_title",
    "dismissable_body",
    "step",
    "step_title",
    "step_body",
    "escape",
    "escape_title",
    "escape_body",
    "done",
    "live_trigger",
    "live_title",
    "live_body",
    "live_open",
    "state",
    "reposition_trigger",
    "reposition_title",
    "reposition_line",
    "reposition_more",
    "reposition_move",
  ],
});
