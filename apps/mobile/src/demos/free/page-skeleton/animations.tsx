/**
 * Stackra file contract:
 * Purpose: the "animations" demo of the native PageSkeleton: `animationType` sweep, pulse or still.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SkeletonAnimation } from "@stackra/ui/contracts";
import { PageSkeleton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_SKELETON_DEMO_KEYS } from "#src/demos/free/page-skeleton/page-skeleton-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_SKELETON_DEMO_KEYS.demo_free.page_skeleton.animations;

/** A shimmering sweep, a slow pulse and a still placeholder. */
export default function Animations() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {SkeletonAnimation.map((animation) => (
        <Sample key={animation} caption={`animationType="${animation}"`}>
          <PageSkeleton
            layout="section"
            animationType={animation}
            loadingLabel={t(K.label, { animation })}
          />
        </Sample>
      ))}
    </View>
  );
}
