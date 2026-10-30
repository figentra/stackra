/**
 * Stackra file contract:
 * Purpose: `GALLERY_KEYS`, the typed keys of the media demos' words in `assets/lang/<locale>/gallery.json`: the
 *          pictures' alt texts and captions, shared by the Gallery, Lightbox, Carousel and ImageCropper demos (their own words have namespaces of their own).
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The gallery namespace's keys. */
export const GALLERY_KEYS = keys({
  gallery: [
    "label",
    "masonry_label",
    "dunes",
    "harbour",
    "palms",
    "souk",
    "oasis",
    "skyline",
    "lanterns",
    "coast",
    "dunes_caption",
    "harbour_caption",
  ],
});
