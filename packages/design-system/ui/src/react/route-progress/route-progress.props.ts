/**
 * Stackra file contract:
 * Purpose: `RouteProgressProps`, the props of the web `RouteProgress` in `route-progress.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 29.
 */
import type { RouteProgressContractProps } from "#contracts/types/route-progress-contract-props.type";

/** Props of the web RouteProgress, with a class for the track. */
export type RouteProgressProps = RouteProgressContractProps & {
  readonly className?: string | undefined;
};
