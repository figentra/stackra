/**
 * Stackra file contract:
 * Purpose: `KIOSK_SURFACE_KEYS`, the typed keys of the web Kiosk surface demos' words in `assets/lang/<locale>/kiosk_surface.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The kiosk_surface namespace's keys. */
export const KIOSK_SURFACE_KEYS = keys({
  kiosk_surface: [
    "welcome",
    "start",
    "basket",
    "resets",
    "add",
    "added",
    "pay",
    "high_contrast",
    "area_idle",
    "area_reach",
  ],
});
