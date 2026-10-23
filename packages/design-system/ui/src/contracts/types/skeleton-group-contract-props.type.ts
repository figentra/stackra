/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SkeletonGroup` takes: one loading state and one animation for every Skeleton
 *          inside it, and the spoken text of the loading region. A Skeleton inside may still set its own values.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract); ADR 0303 (decision 7); ADR 0304; WCAG 2.2
 *          SC 4.1.3 (status messages).
 */
import type { ReactNode } from "react";

import type { SkeletonContractProps } from "#contracts/types/skeleton-contract-props.type";

/** Props shared by the web and native `SkeletonGroup`. */
export interface SkeletonGroupContractProps extends Omit<SkeletonContractProps, "children"> {
  /** The layout of the region: Skeletons, each holding its loaded content, and any wrapper elements around them. */
  readonly children?: ReactNode;
  /** The spoken text naming what loads, for example "Loading orders"; it is read only while the region loads. */
  readonly loadingLabel?: string | undefined;
}
