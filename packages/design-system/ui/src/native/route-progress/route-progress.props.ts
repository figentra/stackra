/**
 * Stackra file contract:
 * Purpose: `RouteProgressProps`, the props of the native `RouteProgress` in `route-progress.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 29.
 */
import type { RouteProgressContractProps } from "#contracts/types/route-progress-contract-props.type";

/** Props of the native RouteProgress. */
export type RouteProgressProps = RouteProgressContractProps;
