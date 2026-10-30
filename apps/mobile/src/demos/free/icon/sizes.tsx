/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Icon: `sm` 16, `md` 20 and `lg` 24 points; decorative, so screen readers skip them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Size } from "@stackra/ui/contracts";
import { Icon } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

/** The icons each size draws; every name is registered in the app root. */
const ICON_NAMES = ["search", "heart", "star"] as const;

/** Three icons in each size. */
export default function Sizes() {
  return (
    <View className="flex-row flex-wrap gap-6">
      {Size.map((size) => (
        <Sample key={size} caption={size}>
          <View className="flex-row gap-2">
            {ICON_NAMES.map((name) => (
              <Icon key={name} name={name} size={size} />
            ))}
          </View>
        </Sample>
      ))}
    </View>
  );
}
