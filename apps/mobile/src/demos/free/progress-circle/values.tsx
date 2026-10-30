/**
 * Stackra file contract:
 * Purpose: the "values" demo of the native ProgressCircle: `value` from 0 to 100; the ring is named and spoken.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ProgressCircle, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_CIRCLE_DEMO_KEYS } from "#src/demos/free/progress-circle/progress-circle-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_CIRCLE_DEMO_KEYS.demo_free.progress_circle.values;

/** Five rings; the ring draws no text. */
export default function Values() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap items-end gap-6">
      {[0, 25, 50, 75, 100].map((value) => (
        <Sample key={value} caption={t(K.caption, { value })}>
          <ProgressCircle value={value} label={t(K.label, { value })} />
        </Sample>
      ))}
    </View>
  );
}
