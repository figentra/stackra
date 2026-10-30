/**
 * Stackra file contract:
 * Purpose: the "determinate" demo of the web Progress circle: From empty to full; the arc starts at the top and runs
 *          clockwise.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { ProgressCircle as UiProgressCircle, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_CIRCLE_KEYS } from "#src/demos/free/progress-circle/progress-circle-keys.constant";

/** The demo's keys. */
const K = PROGRESS_CIRCLE_KEYS.progress_circle;

/** The row that lays rings out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** Progress circle: Determinate. */
export default function Determinate() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      {[0, 25, 50, 75, 100].map((step) => (
        <UiProgressCircle
          key={step}
          size="lg"
          value={step}
          label={t(K.value_label, { value: step })}
          data-value={step}
        />
      ))}
    </div>
  );
}
