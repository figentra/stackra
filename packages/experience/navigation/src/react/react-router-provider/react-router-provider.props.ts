/**
 * Stackra file contract:
 * Purpose: `ReactRouterProviderProps`, the props of the web `ReactRouterProvider`: the tree whose links navigate through
 *          React Router.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0317 (decision 2).
 */
import type { ReactNode } from "react";

/** Props of `ReactRouterProvider`. */
export interface ReactRouterProviderProps {
  /** The tree whose links navigate through React Router. */
  readonly children?: ReactNode;
}
