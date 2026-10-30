/**
 * Stackra file contract:
 * Purpose: the "passthrough" demo of the native Icon: every other Svg prop reaches the icon, here `strokeWidth`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Icon } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

/** A thinner and a thicker stroke. */
export default function Passthrough() {
  return (
    <View className="flex-row flex-wrap gap-8">
      <Sample caption="strokeWidth 1">
        <Icon name="search" size="lg" strokeWidth={1} />
      </Sample>
      <Sample caption="strokeWidth 3">
        <Icon name="search" size="lg" strokeWidth={3} />
      </Sample>
    </View>
  );
}
