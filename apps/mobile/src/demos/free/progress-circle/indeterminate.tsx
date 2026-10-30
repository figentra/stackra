/**
 * Stackra file contract:
 * Purpose: the "indeterminate" demo of the native ProgressCircle: without a `value` the arc turns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ProgressCircle, useCatalogueText } from "@stackra/ui/native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_CIRCLE_DEMO_KEYS } from "#src/demos/free/progress-circle/progress-circle-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_CIRCLE_DEMO_KEYS.demo_free.progress_circle.indeterminate;

/** Work under way; its end is unknown. */
export default function Indeterminate() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sample caption={t(K.caption)}>
      <ProgressCircle label={t(K.label)} />
    </Sample>
  );
}
