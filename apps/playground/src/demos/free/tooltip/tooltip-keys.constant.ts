/**
 * Stackra file contract:
 * Purpose: `TOOLTIP_KEYS`, the typed keys of the web Tooltip demos' words in `assets/lang/<locale>/tooltip.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tooltip namespace's keys. */
export const TOOLTIP_KEYS = keys({
  tooltip: [
    "top",
    "bottom",
    "start",
    "end",
    "side_text",
    "align_start",
    "align_center",
    "align_end",
    "align_text",
    "without_arrow",
    "with_arrow",
    "arrow_text",
    "settings_label",
    "settings_text",
    "alerts_label",
    "alerts_text",
    "download_label",
    "download_text",
    "default_delay",
    "default_delay_text",
    "no_delay",
    "no_delay_text",
    "switched_off",
    "switched_off_text",
    "live_trigger",
    "live_text",
    "live_show",
    "state",
  ],
});
