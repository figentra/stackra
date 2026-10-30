/**
 * Stackra file contract:
 * Purpose: the "masonry" demo of the web Gallery: eight photos of mixed shapes, each at its own shape in three
 *          columns; a press opens the lightbox.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Gallery, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_KEYS } from "#src/demos/free/gallery/gallery-keys.constant";

/** The demo's keys. */
const K = GALLERY_KEYS.gallery;

/** Gallery: a masonry of the photos' own shapes. */
export default function Masonry() {
  const t = useCatalogueText(MESSAGES.en);
  const images = DEMO_PHOTOS.map((photo) => ({ ...photo, alt: t(K[photo.id]) }));
  return (
    <Gallery label={t(K.masonry_label)} layout="masonry" images={images} className="max-w-xl" />
  );
}
