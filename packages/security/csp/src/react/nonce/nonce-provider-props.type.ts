/**
 * Stackra file contract:
 * Purpose: `NonceProviderProps`, the props of `NonceProvider`: the request's nonce and the tree under it.
 * Boundary: a type only (ADR 0305 rules 10 to 12: Props is its own file).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 12); ADR 0294 (decision 23).
 */
import type { ReactNode } from "react";

/** The props of `NonceProvider`. */
export interface NonceProviderProps {
  /** The nonce `createNonce` minted for this request, the one the policy header carries. */
  readonly value: string;

  /** The tree that renders with it. */
  readonly children?: ReactNode;
}
