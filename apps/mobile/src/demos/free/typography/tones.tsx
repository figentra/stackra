/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native `Text`: each `tone` on the page background and on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { TextTone } from "@stackra/ui/contracts";
import { Surface, Text } from "@stackra/ui/native";
import { View } from "react-native";

/** The tone names, side by side on the page and on a secondary surface. */
export default function Tones() {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1 gap-1">
        {TextTone.map((tone) => (
          <Text key={tone} tone={tone}>
            {tone}
          </Text>
        ))}
      </View>
      <Surface variant="secondary" className="flex-1 gap-1">
        {TextTone.map((tone) => (
          <Text key={tone} tone={tone}>
            {tone}
          </Text>
        ))}
      </Surface>
    </View>
  );
}
