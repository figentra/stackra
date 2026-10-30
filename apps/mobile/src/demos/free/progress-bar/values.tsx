/**
 * Stackra file contract:
 * Purpose: the "values" demo of the native ProgressBar: `value` from 0 to 100; label and percentage drawn above.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ProgressBar, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_DEMO_KEYS } from "#src/demos/free/progress-bar/progress-bar-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_DEMO_KEYS.demo_free.progress_bar.values;

/** Empty, a third and full. */
export default function Values() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {[0, 35, 100].map((value) => (
        <ProgressBar
          key={value}
          value={value}
          label={t(K.label, { value })}
          isLabelVisible
          isValueVisible
        />
      ))}
    </View>
  );
}
