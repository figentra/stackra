/**
 * Stackra file contract:
 * Purpose: the native `PageSkeleton`: placeholders shaped like the screen that is loading (a whole page, a table, a
 *          section or a form), drawn as one `SkeletonGroup` so they share one state and one spoken name. A screen
 *          renders it until its query resolves.
 * Boundary: composes `Skeleton` and `SkeletonGroup` only, from the rows of `PAGE_SKELETON_ROWS`, the same data the
 *           web runtime draws. HeroUI Native hands every group prop but `className` and `style` to each bone, so the
 *           layout classes sit on the wrapper views, not on the group. `loadingLabel` is required and read once as
 *           one busy progress element.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { PAGE_SKELETON_ROWS } from "#core/constants/page-skeleton-rows.constant";
import { Skeleton } from "#native/skeleton/skeleton";
import { SkeletonGroup } from "#native/skeleton-group/skeleton-group";
import type { PageSkeletonProps } from "#native/page-skeleton/page-skeleton.props";

/** Placeholders for a page, a table, a section or a form, loading as one named region. */
export function PageSkeleton({
  layout = "page",
  loadingLabel,
  animationType,
  ...rest
}: PageSkeletonProps): ReactElement {
  return (
    <SkeletonGroup {...rest} loadingLabel={loadingLabel} animationType={animationType}>
      <View className="w-full gap-4">
        {PAGE_SKELETON_ROWS[layout].map((row) => (
          <View
            key={row.id}
            className={["flex-row items-center gap-4", row.className].filter(Boolean).join(" ")}
          >
            {row.bones.map((bone) => (
              <Skeleton key={bone.id} className={bone.className} />
            ))}
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}
