/**
 * Stackra file contract:
 * Purpose: the "avatar" demo of the native ImageCropper: a round frame over a square photo; drag it and zoom with the
 *          slider.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { ImageCropper, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_DEMO_KEYS } from "#src/demos/free/gallery/gallery-demo-keys.constant";

/** The demo's keys. */
const K = GALLERY_DEMO_KEYS.demo_free.gallery.photos;

/** ImageCropper: a round avatar. */
export default function Avatar() {
  const t = useCatalogueText(MESSAGES.en);
  return <ImageCropper label={t(K.avatar_label)} src={DEMO_PHOTOS[2].src} shape="round" />;
}
