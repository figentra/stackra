/**
 * Stackra file contract:
 * Purpose: the props every runtime's `PageSkeleton` takes: the layout of placeholders to draw, the spoken name of
 *          what loads, and how the placeholders move. A route's fallback file renders it.
 * Boundary: types only. The label is required because a page of placeholders is silent otherwise.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3 (status messages).
 */
import type { PageSkeletonLayout } from "#contracts/enums/page-skeleton-layout.enum";
import type { SkeletonContractProps } from "#contracts/types/skeleton-contract-props.type";

/** Props shared by the web and native `PageSkeleton`. */
export interface PageSkeletonContractProps extends Pick<SkeletonContractProps, "animationType"> {
  /** The shape of the page being loaded: `page`, `table`, `section` or `form`. Defaults to `page`. */
  readonly layout?: PageSkeletonLayout | undefined;
  /** The spoken name of what loads, for example "Loading orders". Required: it is read once while the page loads. */
  readonly loadingLabel: string;
}
