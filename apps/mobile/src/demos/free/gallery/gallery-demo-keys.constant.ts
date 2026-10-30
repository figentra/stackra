/**
 * Stackra file contract:
 * Purpose: `GALLERY_DEMO_KEYS`, the typed keys of the native media demos' words in
 *          `assets/lang/<locale>/demo_free.json`, shared by the Gallery, Lightbox, Carousel and ImageCropper demos.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave C).
 */
import { keys } from "@stackra/i18n";

/** The media demos' keys. */
export const GALLERY_DEMO_KEYS = keys({
  demo_free: {
    gallery: {
      photos: [
        "label",
        "masonry_label",
        "dunes",
        "harbour",
        "palms",
        "souk",
        "oasis",
        "skyline",
        "dunes_caption",
        "open_viewer",
        "avatar_label",
      ],
    },
  },
});
