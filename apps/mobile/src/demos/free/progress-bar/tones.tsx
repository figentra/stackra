/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native ProgressBar: `tone`: the colour role of the fill.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { ProgressBar, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_DEMO_KEYS } from "#src/demos/free/progress-bar/progress-bar-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_DEMO_KEYS.demo_free.progress_bar.tones;

/** One bar per value, at 60. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {Enum.values(Tone).map((tone) => (
        <ProgressBar key={tone} value={60} tone={tone} label={t(K.label, { tone })} />
      ))}
    </View>
  );
}
