/**
 * Stackra file contract:
 * Purpose: the "sweep" demo of the web Skeleton: A group draws one sweep over all its tiles; three lone bones each
 *          draw their own.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Skeleton as UiSkeleton, SkeletonGroup, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SKELETON_KEYS } from "#src/demos/free/skeleton/skeleton-keys.constant";

/** The demo's keys. */
const K = SKELETON_KEYS.skeleton;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** Skeleton: One sweep. */
export default function Sweep() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      <div className="grid gap-2">
        <Text tone="muted" type="small">
          {t(K.grouped)}
        </Text>
        <SkeletonGroup className="grid w-72 grid-cols-3 gap-3" data-sample="group">
          <UiSkeleton className="h-16" />
          <UiSkeleton className="h-16" />
          <UiSkeleton className="h-16" />
        </SkeletonGroup>
      </div>
      <div className="grid gap-2">
        <Text tone="muted" type="small">
          {t(K.lone)}
        </Text>
        <div className="grid w-72 grid-cols-3 gap-3" data-sample="lone">
          <UiSkeleton className="h-16" />
          <UiSkeleton className="h-16" />
          <UiSkeleton className="h-16" />
        </div>
      </div>
    </div>
  );
}
