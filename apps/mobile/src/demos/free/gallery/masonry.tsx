/**
 * Stackra file contract:
 * Purpose: the "masonry" demo of the native Gallery: six photos of mixed shapes dealt into two columns at their own
 *          shapes; a press opens the lightbox.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Gallery, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_DEMO_KEYS } from "#src/demos/free/gallery/gallery-demo-keys.constant";

/** The demo's keys. */
const K = GALLERY_DEMO_KEYS.demo_free.gallery.photos;

/** Gallery: a masonry of the photos' own shapes. */
export default function Masonry() {
  const t = useCatalogueText(MESSAGES.en);
  const images = DEMO_PHOTOS.map((photo) => ({ ...photo, alt: t(K[photo.id]) }));
  return <Gallery label={t(K.masonry_label)} layout="masonry" columns={2} images={images} />;
}
