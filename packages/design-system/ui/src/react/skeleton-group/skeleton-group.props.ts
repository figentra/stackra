/**
 * Stackra file contract:
 * Purpose: `SkeletonGroupProps`, the props of the web `SkeletonGroup` in `skeleton-group.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0165; ADR 0304; WCAG 2.2 SC 4.1.3.
 */
import type { ComponentPropsWithRef } from "react";
import type { SkeletonGroupContractProps } from "#contracts/types/skeleton-group-contract-props.type";

/** Props of the web SkeletonGroup: the shared contract plus the props of its root `div`, passed through. */
export type SkeletonGroupProps = SkeletonGroupContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof SkeletonGroupContractProps>;
