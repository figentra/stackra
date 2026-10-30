/**
 * Stackra file contract:
 * Purpose: the "width" demo of the web Text area: Full width fills its parent, which is the default; turn it off to
 *          size to the content.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { TextArea as UiTextArea, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_KEYS } from "#src/demos/free/text-area/text-area-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_KEYS.text_area;

/** Text area: Width. */
export default function Width() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <UiTextArea label={t(K.full)} />
      <UiTextArea label={t(K.content)} isFullWidth={false} />
    </div>
  );
}
