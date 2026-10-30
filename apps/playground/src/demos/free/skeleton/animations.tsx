/**
 * Stackra file contract:
 * Purpose: the "animations" demo of the web Skeleton: A card per animation: a shimmering sweep, a slow pulse and a
 *          still placeholder.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { SkeletonAnimation } from "@stackra/ui/contracts";
import { Skeleton as UiSkeleton, Text } from "@stackra/ui/react";

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** The Skeleton demo: animations. */
export default function Animations() {
  return (
    <div className={ROW}>
      {SkeletonAnimation.map((animationType) => (
        <div key={animationType} data-animation={animationType} className="grid w-56 gap-3">
          <UiSkeleton animationType={animationType} className="h-24" />
          <UiSkeleton animationType={animationType} className="h-3 w-full" />
          <UiSkeleton animationType={animationType} className="h-3 w-4/5" />
          <UiSkeleton animationType={animationType} className="h-3 w-2/5" />
          <Text tone="muted" type="small">
            {animationType}
          </Text>
        </div>
      ))}
    </div>
  );
}
