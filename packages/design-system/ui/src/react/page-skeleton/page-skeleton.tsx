/**
 * Stackra file contract:
 * Purpose: the web `PageSkeleton`: placeholders shaped like the page that is loading (a whole page, a table, a
 *          section or a form), drawn as one `SkeletonGroup` so they share one sweep and one spoken name. A route's
 *          fallback file renders it.
 * Boundary: composes `Skeleton` and `SkeletonGroup` only, from the rows of `PAGE_SKELETON_ROWS`, the same data the
 *           native runtime draws. `loadingLabel` is required and read once while the page loads; the placeholders
 *           themselves are empty boxes that assistive technology never reaches.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3.
 */
import { cn } from "@heroui/react";

import { PAGE_SKELETON_ROWS } from "#core/constants/page-skeleton-rows.constant";
import { Skeleton } from "#react/skeleton/skeleton";
import { SkeletonGroup } from "#react/skeleton-group/skeleton-group";
import type { PageSkeletonProps } from "#react/page-skeleton/page-skeleton.props";

/** Placeholders for a page, a table, a section or a form, loading as one named region. */
export function PageSkeleton({
  layout = "page",
  loadingLabel,
  animationType,
  className,
  ...rest
}: PageSkeletonProps) {
  return (
    <SkeletonGroup
      {...rest}
      data-layout={layout}
      loadingLabel={loadingLabel}
      animationType={animationType}
      className={cn("flex w-full flex-col gap-4", className) ?? ""}
    >
      {PAGE_SKELETON_ROWS[layout].map((row) => (
        <div key={row.id} className={cn("flex items-center gap-4", row.className) ?? ""}>
          {row.bones.map((bone) => (
            <Skeleton key={bone.id} className={bone.className} />
          ))}
        </div>
      ))}
    </SkeletonGroup>
  );
}
