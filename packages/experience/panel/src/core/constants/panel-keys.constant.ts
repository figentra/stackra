/**
 * Stackra file contract:
 * Purpose: `PANEL_KEYS`, the typed keys of this package's own texts in `assets/lang/<locale>/panel.json`: the tile
 *          states, the range picker and its periods, the trend and target lines, and the action runner's dialog and
 *          toasts.
 * Boundary: internal: the web and native entries import it by path; no entry exports it. Each key exists in every base
 *           locale this package ships (en, ar).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0139 (declared confirmation).
 */
import { keys } from "@stackra/i18n";

/** The panel's own keys. */
export const PANEL_KEYS = keys({
  panel: {
    widgets: ["empty", "failed", "retry", "range", "change", "target", "not_rendered"],
    time_range: ["today", "yesterday", "last_7_days", "last_30_days", "this_month", "custom"],
    actions: ["confirm_title", "confirm", "cancel", "done", "refused"],
  },
});
