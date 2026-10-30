/**
 * Stackra file contract:
 * Purpose: the "thumbnails" demo of the native Carousel: five trip photos, one per page, with a strip of thumbnails to
 *          press in place of the dots.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Carousel, useCatalogueText } from "@stackra/ui/native";
import { Image } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_DEMO_KEYS } from "#src/demos/free/gallery/gallery-demo-keys.constant";

/** The demo's keys. */
const K = GALLERY_DEMO_KEYS.demo_free.gallery.photos;

/** Carousel: photos with a thumbnail strip. */
export default function Thumbnails() {
  const t = useCatalogueText(MESSAGES.en);
  const photos = DEMO_PHOTOS.slice(0, 5);
  return (
    <Carousel label={t(K.label)} thumbnails={photos.map((photo) => photo.src)}>
      {photos.map((photo) => (
        <Image
          key={photo.id}
          source={{ uri: photo.src }}
          accessibilityLabel={t(K[photo.id])}
          resizeMode="cover"
          style={{ width: "100%", aspectRatio: 4 / 3 }}
        />
      ))}
    </Carousel>
  );
}
