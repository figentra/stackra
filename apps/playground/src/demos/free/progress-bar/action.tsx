/**
 * Stackra file contract:
 * Purpose: the "action" demo of the web Progress bar: Press Advance to add 10 per cent; at the end the completion is
 *          announced. Reset starts again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { Button, ProgressBar as UiProgressBar, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_KEYS } from "#src/demos/free/progress-bar/progress-bar-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_KEYS.progress_bar;

/** How much each press of Advance adds, in per cent. */
const STEP = 10;

/** The column that holds bars, narrow enough to read as a bar on a wide screen. */
const COLUMN = "grid max-w-md gap-4";

/** Progress bar: Advance and reset. */
export default function Action() {
  const t = useCatalogueText(MESSAGES.en);
  const [value, setValue] = useState(0);

  const advance = () => setValue((current) => Math.min(100, current + STEP));

  return (
    <div className={COLUMN}>
      <UiProgressBar
        value={value}
        label={t(K.action_label)}
        tone={value >= 100 ? "success" : "accent"}
        isLabelVisible
        isValueVisible
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onPress={advance}>
          {t(K.advance)}
        </Button>
        <Button variant="tertiary" onPress={() => setValue(0)}>
          {t(K.reset)}
        </Button>
        <output aria-live="polite">{value >= 100 ? t(K.complete) : ""}</output>
      </div>
    </div>
  );
}
