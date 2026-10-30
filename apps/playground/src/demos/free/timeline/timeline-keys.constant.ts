/**
 * Stackra file contract:
 * Purpose: `TIMELINE_KEYS`, the typed keys of the web Timeline demos' words in `assets/lang/<locale>/timeline.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const TIMELINE_KEYS = keys({
  timeline: {
    order: [
      "label",
      "finance",
      "paid",
      "warehouse",
      "shipped",
      "shipped_body",
      "approved",
      "edited",
      "edited_body",
      "created",
    ],
    compact: ["label", "signed_in", "exported", "role"],
    arabic: ["label", "approved", "edited", "edited_body"],
  },
});
