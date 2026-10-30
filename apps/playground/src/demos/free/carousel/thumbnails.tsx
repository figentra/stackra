/**
 * Stackra file contract:
 * Purpose: the "thumbnails" demo of the web Carousel: five trip photos, one at a time, with a strip of thumbnails to
 *          press in place of the dots.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Carousel, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_KEYS } from "#src/demos/free/gallery/gallery-keys.constant";

/** The demo's keys. */
const K = GALLERY_KEYS.gallery;

/** Carousel: photos with a thumbnail strip. */
export default function Thumbnails() {
  const t = useCatalogueText(MESSAGES.en);
  const photos = DEMO_PHOTOS.slice(0, 5);
  return (
    <Carousel
      label={t(K.label)}
      thumbnails={photos.map((photo) => photo.src)}
      className="w-full max-w-md"
    >
      {photos.map((photo) => (
        <img
          key={photo.id}
          src={photo.src}
          alt={t(K[photo.id])}
          className="block aspect-[4/3] w-full object-cover"
        />
      ))}
    </Carousel>
  );
}
