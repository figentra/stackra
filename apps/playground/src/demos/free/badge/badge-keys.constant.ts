/**
 * Stackra file contract:
 * Purpose: `BADGE_KEYS`, the typed keys of the web Badge demos' words in `assets/lang/<locale>/badge.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The badge namespace's keys. */
export const BADGE_KEYS = keys({
  badge: {
    _: [
      "variant_label",
      "size_label",
      "corner_label",
      "online",
      "away",
      "busy",
      "number",
      "word",
      "icon_label",
      "control_label",
      "presses",
    ],
    sample: ["new"],
  },
});
