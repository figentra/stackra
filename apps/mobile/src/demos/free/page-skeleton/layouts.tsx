/**
 * Stackra file contract:
 * Purpose: the "layouts" demo of the native PageSkeleton: `layout`, the shape of what loads, and its `loadingLabel`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { PageSkeletonLayout } from "@stackra/ui/contracts";
import { PageSkeleton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_SKELETON_DEMO_KEYS } from "#src/demos/free/page-skeleton/page-skeleton-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_SKELETON_DEMO_KEYS.demo_free.page_skeleton.layouts;

/** One skeleton per layout; a screen reader says only the label. */
export default function Layouts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {PageSkeletonLayout.map((layout) => (
        <Sample key={layout} caption={`layout="${layout}"`}>
          <PageSkeleton layout={layout} loadingLabel={t(K.label, { layout })} />
        </Sample>
      ))}
    </View>
  );
}
