/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Progress bar: Small, medium and large: 4, 8 and 12 pixels thick on web and
 *          native.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { Size } from "@stackra/ui/contracts";
import { ProgressBar as UiProgressBar, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_KEYS } from "#src/demos/free/progress-bar/progress-bar-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_KEYS.progress_bar;

/** The column that holds bars, narrow enough to read as a bar on a wide screen. */
const COLUMN = "grid max-w-md gap-4";

/** Progress bar: Sizes. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={COLUMN}>
      {Size.map((size) => (
        <UiProgressBar
          key={size}
          size={size}
          value={60}
          label={t(K.size_label, { size })}
          data-size={size}
        />
      ))}
    </div>
  );
}
