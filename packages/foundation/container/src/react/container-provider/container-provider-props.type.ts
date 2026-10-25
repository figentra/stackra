/**
 * Stackra file contract:
 * Purpose: `ContainerProviderProps`, the props of `ContainerProvider`: the booted container and the tree under it.
 * Boundary: a type only (ADR 0305 rules 10 to 12: Props is its own file).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 12); ADR 0294 (decision 23).
 */
import type { ReactNode } from "react";

import type { Container } from "#core/index";

/** The props of `ContainerProvider`. */
export interface ContainerProviderProps {
  /** The container `createApp` booted for this app or request. */
  readonly container: Container;

  /** The tree that may read it. */
  readonly children?: ReactNode;
}
