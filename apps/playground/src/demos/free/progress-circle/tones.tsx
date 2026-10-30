/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Progress circle: One ring per tone; each fill is drawn 3:1 or more against the
 *          page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { ProgressCircle as UiProgressCircle, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_CIRCLE_KEYS } from "#src/demos/free/progress-circle/progress-circle-keys.constant";

/** The demo's keys. */
const K = PROGRESS_CIRCLE_KEYS.progress_circle;

/** The row that lays rings out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** Progress circle: Tones. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      {Enum.values(Tone).map((tone) => (
        <UiProgressCircle
          key={tone}
          tone={tone}
          value={60}
          label={t(K.tone_label, { tone })}
          data-tone={tone}
        />
      ))}
    </div>
  );
}
