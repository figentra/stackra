/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native ProgressCircle: `tone`: the colour role of the arc.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { ProgressCircle, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_CIRCLE_DEMO_KEYS } from "#src/demos/free/progress-circle/progress-circle-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_CIRCLE_DEMO_KEYS.demo_free.progress_circle.tones;

/** One ring per value, at 60. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap items-end gap-6">
      {Enum.values(Tone).map((tone) => (
        <Sample key={tone} caption={tone}>
          <ProgressCircle value={60} tone={tone} label={t(K.label, { tone })} />
        </Sample>
      ))}
    </View>
  );
}
