/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native InlineLoading: loading, success and error with the default words of the active locale, haptics off.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { InlineLoadingStatus } from "@stackra/ui/contracts";
import { InlineLoading } from "@stackra/ui/native";
import { View } from "react-native";

/** The InlineLoading demo: the loading, success and error states. */
export default function States() {
  return (
    <View className="gap-3">
      {InlineLoadingStatus.filter((status) => status !== "idle").map((status) => (
        <InlineLoading key={status} status={status} playsHaptics={false} />
      ))}
    </View>
  );
}
