/**
 * Stackra file contract:
 * Purpose: the "display-only" demo of the web PageIndicator: dots under a product photo that only show the place
 *          (the third of five), announced as one image.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AspectRatio, PageIndicator, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { PAGE_INDICATOR_KEYS } from "#src/demos/free/page-indicator/page-indicator-keys.constant";

/** The demo's keys. */
const K = PAGE_INDICATOR_KEYS.page_indicator.display_only;

/** PageIndicator: display only. */
export default function DisplayOnly() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-xs justify-items-center gap-3">
      <AspectRatio ratio={4 / 5} className="bg-default">
        <img src={DEMO_PHOTOS[2]?.src} alt={t(K.caption)} />
      </AspectRatio>
      <PageIndicator count={5} index={2} />
    </div>
  );
}
