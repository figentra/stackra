/**
 * Stackra file contract:
 * Purpose: the "shapes" demo of the web Skeleton: Shape and size come from the class alone: lines, an avatar, a media
 *          block and a button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Skeleton as UiSkeleton } from "@stackra/ui/react";

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** The Skeleton demo: shapes. */
export default function Shapes() {
  return (
    <div className={ROW}>
      <div className="grid w-56 gap-2">
        <UiSkeleton className="h-3 w-full" />
        <UiSkeleton className="h-3 w-4/5" />
        <UiSkeleton className="h-3 w-2/5" />
      </div>
      <UiSkeleton className="size-10" />
      <UiSkeleton className="h-32 w-56" />
      <UiSkeleton className="h-9 w-24" />
    </div>
  );
}
