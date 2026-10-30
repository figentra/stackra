/**
 * Stackra file contract:
 * Purpose: the "range" demo of the native ProgressBar: `valueLabel` replaces the percentage; another range.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ProgressBar, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_DEMO_KEYS } from "#src/demos/free/progress-bar/progress-bar-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_DEMO_KEYS.demo_free.progress_bar.range;

/** Three of twelve files. */
export default function Range() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ProgressBar
      value={3}
      minValue={0}
      maxValue={12}
      label={t(K.label)}
      valueLabel={t(K.value_label)}
      isLabelVisible
      isValueVisible
    />
  );
}
