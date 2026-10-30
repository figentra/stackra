/**
 * Stackra file contract:
 * Purpose: the "text" demo of the web Progress bar: The label and the value can be drawn above the bar. A custom
 *          range and value text say what the number means.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { ProgressBar as UiProgressBar, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_KEYS } from "#src/demos/free/progress-bar/progress-bar-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_KEYS.progress_bar;

/** The column that holds bars, narrow enough to read as a bar on a wide screen. */
const COLUMN = "grid max-w-md gap-4";

/** Progress bar: Label and value. */
export default function TextDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={COLUMN}>
      <UiProgressBar value={72} label={t(K.storage)} isLabelVisible isValueVisible />
      <UiProgressBar
        value={3}
        maxValue={12}
        valueLabel={t(K.files_text)}
        label={t(K.files)}
        tone="success"
        isLabelVisible
        isValueVisible
      />
    </div>
  );
}
