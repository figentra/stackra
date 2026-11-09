/**
 * Stackra file contract:
 * Purpose: `SECTION_DOCK_KEYS`, the typed keys of the web SectionDock demos' words in
 *          `assets/lang/<locale>/section_dock.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The section_dock namespace's keys. */
export const SECTION_DOCK_KEYS = keys({
  section_dock: [
    "label",
    "plans",
    "plans_text",
    "plans_status",
    "trials",
    "trials_text",
    "trials_status",
    "usage",
    "usage_text",
    "usage_status",
    "dunning",
    "dunning_text",
    "dunning_status",
  ],
});
