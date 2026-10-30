/**
 * Stackra file contract:
 * Purpose: `WAVE_D_CHART_KEYS`, the typed keys of the wave D charts' own words in `assets/lang/<locale>/ui.json`
 *          (`ui::waffle_chart.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the wave D charts
 *           land without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { keys } from "@stackra/i18n";

/** The wave D charts' keys. */
export const WAVE_D_CHART_KEYS = keys({
  ui: {
    waffle_chart: ["share"],
  },
});
