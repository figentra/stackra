/**
 * Stackra file contract:
 * Purpose: the "photo" demo of the web Image: a photo at the container's width with a blur-up placeholder and a caption.
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
const K = IMAGE_KEYS.image.photo;

/** Image: a photo at the container's width with a caption. */
export default function Photo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Image
      className="max-w-lg"
      src={DUNES.src}
      placeholderSrc={DUNES.tiny}
      alt={t(K.alt)}
      caption={t(K.caption)}
    />
  );
}
