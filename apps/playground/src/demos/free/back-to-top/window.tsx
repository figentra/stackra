/**
 * Stackra file contract:
 * Purpose: the "window" demo of the web BackToTop: a page-level button that shows at the viewport's bottom corner
 *          once this page is scrolled down.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { BackToTop, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BACK_TO_TOP_KEYS } from "#src/demos/free/back-to-top/back-to-top-keys.constant";

/** The demo's keys. */
const K = BACK_TO_TOP_KEYS.back_to_top.window;

/** BackToTop: on the whole page. */
export default function Window() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      <Text tone="muted">{t(K.hint)}</Text>
      <BackToTop />
    </>
  );
}
