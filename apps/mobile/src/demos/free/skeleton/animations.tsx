/**
 * Stackra file contract:
 * Purpose: the "animations" demo of the native Skeleton: `animationType` sweep, pulse or still.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SkeletonAnimation } from "@stackra/ui/contracts";
import { Card, Skeleton, SkeletonGroup } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

/** Two lines per animation; the shape is the skeleton's own token radius. */
export default function Animations() {
  return (
    <View className="gap-4">
      {SkeletonAnimation.map((animation) => (
        <Sample key={animation} caption={animation}>
          <Card className="w-full">
            <SkeletonGroup animationType={animation} className="gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </SkeletonGroup>
          </Card>
        </Sample>
      ))}
    </View>
  );
}
