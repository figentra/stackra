/**
 * Stackra file contract:
 * Purpose: the "beside" demo of the web Progress circle: The ring is named; the text next to it shows the number and
 *          the state.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { ProgressCircle as UiProgressCircle, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_CIRCLE_KEYS } from "#src/demos/free/progress-circle/progress-circle-keys.constant";

/** The demo's keys. */
const K = PROGRESS_CIRCLE_KEYS.progress_circle;

/** Progress circle: Beside text. */
export default function Beside() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex items-center gap-2">
      <UiProgressCircle size="sm" value={75} label={t(K.beside_label)} />
      <Text tone="muted">{t(K.beside_text)}</Text>
    </div>
  );
}
