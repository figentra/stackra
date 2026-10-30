/**
 * Stackra file contract:
 * Purpose: `MEDIA_KEYS`, the typed keys of the wave C media components' own words in `assets/lang/<locale>/ui.json`
 *          (`ui::lightbox.*`, `ui::gallery.*`, `ui::image_cropper.*`).
 * Boundary: keys only; internal. Kept beside `UI_KEYS` so parallel builds never edit that file; fold it in later.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The media components' keys. */
export const MEDIA_KEYS = keys({
  ui: {
    lightbox: ["label", "previous", "next", "close", "counter", "zoom_in", "zoom_out"],
    gallery: ["open"],
    image_cropper: ["label", "zoom", "hint", "hint_touch", "loading"],
  },
});
