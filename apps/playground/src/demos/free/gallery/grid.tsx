/**
 * Stackra file contract:
 * Purpose: the "grid" demo of the web Gallery: eight trip photos as square tiles in three columns; a press opens the
 *          photo in the lightbox, where the others are an arrow key or a swipe away.
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

/** Gallery: a square grid that opens the lightbox. */
export default function Grid() {
  const t = useCatalogueText(MESSAGES.en);
  const images = DEMO_PHOTOS.map((photo) => ({
    ...photo,
    alt: t(K[photo.id]),
    ...(photo.id === "dunes" ? { caption: t(K.dunes_caption) } : {}),
    ...(photo.id === "harbour" ? { caption: t(K.harbour_caption) } : {}),
  }));
  return <Gallery label={t(K.label)} images={images} className="max-w-xl" />;
}
