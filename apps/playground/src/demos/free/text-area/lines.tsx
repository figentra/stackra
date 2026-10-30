/**
 * Stackra file contract:
 * Purpose: the "lines" demo of the web Text area: Two lines and six lines; the area scrolls once the text is longer.
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

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** Text area: Lines. */
export default function Lines() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiTextArea label={t(K.two_lines)} rows={2} />
      <UiTextArea label={t(K.six_lines)} rows={6} />
    </div>
  );
}
