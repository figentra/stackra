/**
 * Stackra file contract:
 * Purpose: the "sweep" demo of the native Skeleton: a `SkeletonGroup` draws one sweep; lone bones each draw their own.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Skeleton, SkeletonGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { SKELETON_DEMO_KEYS } from "#src/demos/free/skeleton/skeleton-demo-keys.constant";

/** The demo's keys. */
const K = SKELETON_DEMO_KEYS.demo_free.skeleton.sweep;

/** Three grouped bones, then three lone ones. */
export default function Sweep() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <Sample caption={t(K.grouped)}>
        <SkeletonGroup className="flex-row gap-2">
          <Skeleton className="size-16" />
          <Skeleton className="size-16" />
          <Skeleton className="size-16" />
        </SkeletonGroup>
      </Sample>
      <Sample caption={t(K.lone)}>
        <View className="flex-row gap-2">
          <Skeleton className="size-16" />
          <Skeleton className="size-16" />
          <Skeleton className="size-16" />
        </View>
      </Sample>
    </View>
  );
}
