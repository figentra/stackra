/**
 * Stackra file contract:
 * Purpose: `DISPLAY_KEYS`, the typed keys of the wave A components' own words in `assets/lang/<locale>/ui.json`:
 *          pagination, tag input, stepper, timeline, loading overlay, truncate, countdown, listbox, select and multi-select
 *          extras, the date picker's presets and the result states.
 * Boundary: internal: the web and native entries import it by path; no entry exports it. Each key exists in every base
 *           locale this package ships (ar, en, fr, de, es, it, nl).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The wave A components' keys. */
export const DISPLAY_KEYS = keys({
  ui: {
    pagination: ["label", "previous", "next", "page", "more", "per_page", "jump", "go", "summary"],
    tag_input: ["remove", "duplicate", "max", "count"],
    stepper: ["label", "step_of", "complete", "error", "optional"],
    timeline: ["label", "today", "yesterday"],
    loading_overlay: ["loading"],
    truncate: ["more", "less"],
    countdown: ["left", "elapsed", "done"],
    multi_select_more: ["select_all", "clear_all", "more", "more_label"],
    date_presets: [
      "label",
      "today",
      "yesterday",
      "tomorrow",
      "in_7_days",
      "start_of_month",
      "end_of_month",
    ],
  },
});
