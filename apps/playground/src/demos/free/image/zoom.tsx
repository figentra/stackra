/**
 * Stackra file contract:
 * Purpose: the "zoom" demo of the web Image: a press opens the picture full size in the lightbox.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Image, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DUNES } from "#src/demos/free/image/dunes.constant";
import { IMAGE_KEYS } from "#src/demos/free/image/image-keys.constant";

/** The demo's keys. */
const K = IMAGE_KEYS.image.zoom;

/** Image: a press opens the picture full size. */
export default function Zoom() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Image
      className="max-w-sm"
      src={DUNES.src}
      alt={t(K.alt)}
      caption={t(K.caption)}
      aspectRatio={4 / 3}
      isZoomable
    />
  );
}
