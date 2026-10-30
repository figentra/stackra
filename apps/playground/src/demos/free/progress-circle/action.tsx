/**
 * Stackra file contract:
 * Purpose: the "action" demo of the web Progress circle: Press Advance to add 10 per cent; at the end the completion
 *          is announced. Reset starts again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { Button, ProgressCircle as UiProgressCircle, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_CIRCLE_KEYS } from "#src/demos/free/progress-circle/progress-circle-keys.constant";

/** The demo's keys. */
const K = PROGRESS_CIRCLE_KEYS.progress_circle;

/** How much each press of Advance adds, in per cent. */
const STEP = 10;

/** The row that lays rings out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** Progress circle: Advance and reset. */
export default function Action() {
  const t = useCatalogueText(MESSAGES.en);
  const [value, setValue] = useState(0);

  const advance = () => setValue((current) => Math.min(100, current + STEP));

  return (
    <div className={ROW}>
      <UiProgressCircle
        size="lg"
        value={value}
        label={t(K.action_label)}
        tone={value >= 100 ? "success" : "accent"}
      />
      <Button variant="secondary" onPress={advance}>
        {t(K.advance)}
      </Button>
      <Button variant="tertiary" onPress={() => setValue(0)}>
        {t(K.reset)}
      </Button>
      <output aria-live="polite">{value >= 100 ? t(K.complete) : ""}</output>
    </div>
  );
}
