/**
 * Stackra file contract:
 * Purpose: `PageSkeletonProps`, the props of the web `PageSkeleton` in `page-skeleton.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0304; ADR 0313
 *          (decisions 1 and 6); WCAG 2.2 SC 4.1.3.
 */
import type { PageSkeletonContractProps } from "#contracts/types/page-skeleton-contract-props.type";
import type { SkeletonGroupProps } from "#react/skeleton-group/skeleton-group.props";

/** Props of the web PageSkeleton: the shared contract plus the attributes of its group's `div`, passed through. */
export type PageSkeletonProps = PageSkeletonContractProps &
  Omit<SkeletonGroupProps, keyof PageSkeletonContractProps | "children" | "isLoading">;
