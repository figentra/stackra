/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native ProgressBar: `size`: the thickness of the track.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Size } from "@stackra/ui/contracts";
import { ProgressBar, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_DEMO_KEYS } from "#src/demos/free/progress-bar/progress-bar-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_DEMO_KEYS.demo_free.progress_bar.sizes;

/** One bar per value, at 60. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {Size.map((size) => (
        <ProgressBar key={size} value={60} size={size} label={t(K.label, { size })} />
      ))}
    </View>
  );
}
