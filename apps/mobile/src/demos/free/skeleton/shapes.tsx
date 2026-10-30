/**
 * Stackra file contract:
 * Purpose: the "shapes" demo of the native Skeleton: size comes from the class: lines, an avatar, a media block, a button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Skeleton } from "@stackra/ui/native";
import { View } from "react-native";

/** The radius is the skeleton's token, never a class (ADR 0302). */
export default function Shapes() {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <Skeleton className="size-12" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </View>
      </View>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-28" />
    </View>
  );
}
