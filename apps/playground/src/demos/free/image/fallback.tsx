/**
 * Stackra file contract:
 * Purpose: the "fallback" demo of the web Image: no image, and a broken link, each keep their space and show an icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Image, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { IMAGE_KEYS } from "#src/demos/free/image/image-keys.constant";

/** The demo's keys. */
const K = IMAGE_KEYS.image.fallback;

/** Image: missing and broken pictures keep their space. */
export default function Fallback() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-4">
      <Image caption={t(K.missing)} />
      <Image src="data:image/png;base64,broken" caption={t(K.broken)} />
    </div>
  );
}
